//! Reads the family and full face names stored in a font file's `name` table.
//!
//! The font picker needs names that a WebView can resolve. File names
//! ("YuGothM.ttc") and registry value names ("MS Gothic & MS UI Gothic (TrueType)")
//! are not reliable, whereas the `name` table holds the real family
//! (ID 1 / 16) and full face name (ID 4).

use std::fs::File;
use std::io::{Read, Seek, SeekFrom};
use std::path::Path;

const NAME_ID_FAMILY: u16 = 1;
const NAME_ID_FULL: u16 = 4;
const NAME_ID_TYPOGRAPHIC_FAMILY: u16 = 16;
const MAX_NAME_TABLE_BYTES: usize = 1 << 20;
const MAX_FACES_PER_COLLECTION: u32 = 64;
const LANGUAGE_ENGLISH_US: u16 = 0x0409;

fn be_u16(bytes: &[u8], offset: usize) -> Option<u16> {
    let slice = bytes.get(offset..offset.checked_add(2)?)?;
    Some(u16::from_be_bytes([slice[0], slice[1]]))
}

fn be_u32(bytes: &[u8], offset: usize) -> Option<u32> {
    let slice = bytes.get(offset..offset.checked_add(4)?)?;
    Some(u32::from_be_bytes([slice[0], slice[1], slice[2], slice[3]]))
}

fn read_at(file: &mut File, offset: u64, length: usize) -> Option<Vec<u8>> {
    file.seek(SeekFrom::Start(offset)).ok()?;
    let mut buffer = vec![0u8; length];
    let mut filled = 0;
    while filled < length {
        match file.read(&mut buffer[filled..]) {
            Ok(0) => break,
            Ok(read) => filled += read,
            Err(_) => return None,
        }
    }
    buffer.truncate(filled);
    (!buffer.is_empty()).then_some(buffer)
}

fn decode_name(platform: u16, raw: &[u8]) -> Option<String> {
    let text = match platform {
        // Unicode and Windows platforms store UTF-16BE.
        0 | 3 => {
            let units: Vec<u16> = raw
                .chunks_exact(2)
                .map(|pair| u16::from_be_bytes([pair[0], pair[1]]))
                .collect();
            String::from_utf16(&units).ok()?
        }
        // Macintosh Roman: the names used for picking are ASCII in practice.
        1 => raw.iter().map(|byte| *byte as char).collect(),
        _ => return None,
    };
    let trimmed = text.trim();
    (!trimmed.is_empty()).then(|| trimmed.to_string())
}

/// Picks the English record of `name_id`, otherwise the first record found.
fn pick_name(table: &[u8], name_id: u16) -> Option<String> {
    let count = be_u16(table, 2)? as usize;
    let string_offset = be_u16(table, 4)? as usize;
    let mut fallback: Option<String> = None;
    for index in 0..count {
        let record = 6 + index * 12;
        let platform = be_u16(table, record)?;
        let language = be_u16(table, record + 4)?;
        if be_u16(table, record + 6)? != name_id {
            continue;
        }
        let length = be_u16(table, record + 8)? as usize;
        let offset = string_offset.checked_add(be_u16(table, record + 10)? as usize)?;
        let Some(raw) = table.get(offset..offset.checked_add(length)?) else {
            continue;
        };
        let Some(name) = decode_name(platform, raw) else {
            continue;
        };
        let english = (platform == 3 && language == LANGUAGE_ENGLISH_US)
            || (platform == 1 && language == 0);
        if english {
            return Some(name);
        }
        fallback.get_or_insert(name);
    }
    fallback
}

fn face_names(file: &mut File, face_offset: u64) -> Vec<String> {
    let Some(header) = read_at(file, face_offset, 12) else {
        return Vec::new();
    };
    let table_count = match be_u16(&header, 4) {
        Some(count) if count > 0 && count <= 256 => count as usize,
        _ => return Vec::new(),
    };
    let Some(directory) = read_at(file, face_offset + 12, table_count * 16) else {
        return Vec::new();
    };
    for index in 0..table_count {
        let entry = index * 16;
        if directory.get(entry..entry + 4) != Some(b"name".as_slice()) {
            continue;
        }
        let (Some(offset), Some(length)) = (be_u32(&directory, entry + 8), be_u32(&directory, entry + 12))
        else {
            return Vec::new();
        };
        let length = (length as usize).min(MAX_NAME_TABLE_BYTES);
        let Some(table) = read_at(file, offset as u64, length) else {
            return Vec::new();
        };
        let family = pick_name(&table, NAME_ID_TYPOGRAPHIC_FAMILY)
            .or_else(|| pick_name(&table, NAME_ID_FAMILY));
        let full = pick_name(&table, NAME_ID_FULL);
        return [family, full].into_iter().flatten().collect();
    }
    Vec::new()
}

/// Returns the family and full names of every face in the font file, or an
/// empty list when the file is not a readable TrueType/OpenType font.
pub fn read_font_names(path: &Path) -> Vec<String> {
    let Ok(mut file) = File::open(path) else {
        return Vec::new();
    };
    let Some(magic) = read_at(&mut file, 0, 12) else {
        return Vec::new();
    };
    let mut names = Vec::new();
    match magic.get(0..4) {
        Some(b"ttcf") => {
            let face_count = be_u32(&magic, 8).unwrap_or(0).min(MAX_FACES_PER_COLLECTION);
            let Some(offsets) = read_at(&mut file, 12, face_count as usize * 4) else {
                return Vec::new();
            };
            for index in 0..face_count as usize {
                if let Some(offset) = be_u32(&offsets, index * 4) {
                    names.extend(face_names(&mut file, offset as u64));
                }
            }
        }
        Some(b"OTTO") | Some(b"true") | Some([0x00, 0x01, 0x00, 0x00]) => {
            names.extend(face_names(&mut file, 0));
        }
        _ => {}
    }
    names
}

#[cfg(test)]
mod tests {
    use super::*;

    fn utf16(text: &str) -> Vec<u8> {
        text.encode_utf16().flat_map(|unit| unit.to_be_bytes()).collect()
    }

    /// Builds a single-face sfnt file holding only a `name` table.
    fn sfnt_with_names(records: &[(u16, u16, u16, u16, &[u8])]) -> Vec<u8> {
        let mut strings = Vec::new();
        let mut entries = Vec::new();
        for (platform, language, name_id, _encoding, raw) in records {
            entries.push((*platform, *language, *name_id, raw.len() as u16, strings.len() as u16));
            strings.extend_from_slice(raw);
        }
        let mut table = Vec::new();
        table.extend_from_slice(&0u16.to_be_bytes());
        table.extend_from_slice(&(entries.len() as u16).to_be_bytes());
        table.extend_from_slice(&((6 + entries.len() * 12) as u16).to_be_bytes());
        for (platform, language, name_id, length, offset) in entries {
            for value in [platform, if platform == 3 { 1 } else { 0 }, language, name_id, length, offset] {
                table.extend_from_slice(&value.to_be_bytes());
            }
        }
        table.extend_from_slice(&strings);

        let mut file = Vec::new();
        file.extend_from_slice(b"OTTO");
        file.extend_from_slice(&1u16.to_be_bytes());
        file.extend_from_slice(&[0u8; 6]);
        file.extend_from_slice(b"name");
        file.extend_from_slice(&0u32.to_be_bytes());
        file.extend_from_slice(&(28u32).to_be_bytes());
        file.extend_from_slice(&(table.len() as u32).to_be_bytes());
        file.extend_from_slice(&table);
        file
    }

    fn write_temp(name: &str, bytes: &[u8]) -> std::path::PathBuf {
        let path = std::env::temp_dir().join(format!("kgg-font-names-{}-{name}", std::process::id()));
        std::fs::write(&path, bytes).unwrap();
        path
    }

    #[test]
    fn reads_family_and_full_name_preferring_english() {
        let japanese = utf16("モリサワ明朝");
        let family = utf16("AP OTF A1MinchoStdN");
        let full = utf16("AP OTF A1MinchoStdN Medium");
        let bytes = sfnt_with_names(&[
            (3, 0x0411, NAME_ID_FAMILY, 1, &japanese),
            (3, 0x0409, NAME_ID_FAMILY, 1, &family),
            (3, 0x0409, NAME_ID_FULL, 1, &full),
        ]);
        let path = write_temp("english.otf", &bytes);
        let names = read_font_names(&path);
        std::fs::remove_file(&path).ok();
        assert_eq!(names, vec!["AP OTF A1MinchoStdN", "AP OTF A1MinchoStdN Medium"]);
    }

    #[test]
    fn typographic_family_wins_over_legacy_family() {
        let legacy = utf16("Yu Gothic UI Semibold");
        let typographic = utf16("Yu Gothic UI");
        let bytes = sfnt_with_names(&[
            (3, 0x0409, NAME_ID_FAMILY, 1, &legacy),
            (3, 0x0409, NAME_ID_TYPOGRAPHIC_FAMILY, 1, &typographic),
        ]);
        let path = write_temp("typographic.ttf", &bytes);
        let names = read_font_names(&path);
        std::fs::remove_file(&path).ok();
        assert_eq!(names, vec!["Yu Gothic UI"]);
    }

    #[test]
    fn ignores_files_that_are_not_fonts() {
        let path = write_temp("not-a-font.ttf", b"this is not a font file at all");
        assert!(read_font_names(&path).is_empty());
        std::fs::remove_file(&path).ok();
        assert!(read_font_names(Path::new("does-not-exist.ttf")).is_empty());
    }
}

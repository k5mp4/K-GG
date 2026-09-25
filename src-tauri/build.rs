use std::path::PathBuf;

fn main() {
    let target_is_windows_msvc = std::env::var("CARGO_CFG_TARGET_OS").as_deref() == Ok("windows")
        && std::env::var("CARGO_CFG_TARGET_ENV").as_deref() == Ok("msvc");
    if target_is_windows_msvc {
        println!("cargo:rustc-link-arg-bin=kagaribi_grad=/EXPORT:NvOptimusEnablement,DATA");
        println!("cargo:rustc-link-arg-bin=kagaribi_grad=/EXPORT:AmdPowerXpressRequestHighPerformance,DATA");
        build_spout();
    }

    tauri_build::build()
}

/// Builds the vendored Spout2 SpoutDX subset and K-GG's C ABI wrapper into a
/// static library. Only Windows MSVC targets compile C++; other targets use
/// the Rust stub in `spout_output.rs`.
fn build_spout() {
    let manifest_dir = PathBuf::from(std::env::var("CARGO_MANIFEST_DIR").expect("CARGO_MANIFEST_DIR"));
    let spout_sdk = manifest_dir.join("../vendor/spout2/SPOUTSDK");
    let spout_dx = spout_sdk.join("SpoutDirectX/SpoutDX");
    let spout_gl = spout_sdk.join("SpoutGL");
    let wrapper = manifest_dir.join("native/spout");

    let sources = [
        spout_dx.join("SpoutDX.cpp"),
        spout_gl.join("SpoutCopy.cpp"),
        spout_gl.join("SpoutDirectX.cpp"),
        spout_gl.join("SpoutFrameCount.cpp"),
        spout_gl.join("SpoutSenderNames.cpp"),
        spout_gl.join("SpoutSharedMemory.cpp"),
        spout_gl.join("SpoutUtils.cpp"),
        wrapper.join("kgg_spout.cpp"),
        wrapper.join("kgg_spout_probe.cpp"),
    ];
    for source in &sources {
        println!("cargo:rerun-if-changed={}", source.display());
    }
    for header in [&spout_dx, &spout_gl, &wrapper] {
        println!("cargo:rerun-if-changed={}", header.display());
    }

    cc::Build::new()
        .cpp(true)
        .files(&sources)
        .include(&spout_dx)
        .include(&spout_gl)
        .include(&wrapper)
        .define("SPOUT_BUILD_STATIC", None)
        .define("NOMINMAX", None)
        // Frame conversion runs per sent frame; keep it optimized in dev builds.
        .opt_level(2)
        .flag("/std:c++17")
        .flag("/EHsc")
        // Upstream sources are UTF-8 (some with BOM) plus one Latin-1 comment.
        // Parse as UTF-8 so a Japanese system code page cannot misread them.
        .flag("/utf-8")
        .flag("/wd4828")
        // Upstream code is compiled unchanged; its warnings are not actionable here.
        .warnings(false)
        .compile("kgg_spout");

    for library in ["d3d11", "dxgi", "winmm", "psapi", "shell32", "advapi32", "version", "comctl32", "user32", "gdi32"] {
        println!("cargo:rustc-link-lib={library}");
    }
}

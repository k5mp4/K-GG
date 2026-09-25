// K-GG Spout output C ABI implementation on top of Spout2 SpoutDX.
#include "kgg_spout.h"

#include <cstring>
#include <new>
#include <vector>

#include "SpoutDX.h"

struct kgg_spout_sender {
    spoutDX spout;
    std::vector<uint8_t> staging;
};

namespace {

// Largest 2D texture size guaranteed by Direct3D 11 feature level 11_0.
constexpr uint32_t kMaxDimension = 16384;

// RGBA (bottom-up or top-down) -> top-down BGRA. Unaligned-safe: the input
// comes straight from WebView2 shared memory or an IPC body, whose alignment
// is not guaranteed, so the aligned SSE paths of spoutCopy are not used here.
void convert_rgba_to_bgra(
    const uint8_t* source,
    uint8_t* destination,
    uint32_t width,
    uint32_t height,
    bool bottom_up) {
    const size_t row_bytes = static_cast<size_t>(width) * 4;
    for (uint32_t y = 0; y < height; ++y) {
        const uint32_t source_row = bottom_up ? height - 1 - y : y;
        const uint8_t* source_line = source + static_cast<size_t>(source_row) * row_bytes;
        uint8_t* destination_line = destination + static_cast<size_t>(y) * row_bytes;
        for (size_t x = 0; x < row_bytes; x += 4) {
            uint32_t pixel;
            std::memcpy(&pixel, source_line + x, 4);
            pixel = (pixel & 0xFF00FF00u) | ((pixel & 0x000000FFu) << 16) | ((pixel >> 16) & 0x000000FFu);
            std::memcpy(destination_line + x, &pixel, 4);
        }
    }
}

void copy_name(const char* source, char* destination, uint32_t capacity) {
    if (!destination || capacity == 0) return;
    destination[0] = '\0';
    if (!source) return;
    const size_t length = std::strlen(source);
    const size_t copied = length < capacity - 1 ? length : capacity - 1;
    std::memcpy(destination, source, copied);
    destination[copied] = '\0';
}

}  // namespace

extern "C" int kgg_spout_create(
    const char* name,
    kgg_spout_sender** out_sender,
    char* actual_name,
    uint32_t actual_name_capacity) {
    if (!out_sender) return KGG_SPOUT_INVALID_ARGUMENT;
    *out_sender = nullptr;
    if (!name || !name[0] || std::strlen(name) >= 256) return KGG_SPOUT_INVALID_ARGUMENT;

    kgg_spout_sender* sender = nullptr;
    try {
        sender = new kgg_spout_sender();
        // OpenDirectX11 returns true even when device creation fails, so the
        // device pointer is the only reliable success signal.
        sender->spout.OpenDirectX11();
        if (!sender->spout.GetDX11Device()) {
            delete sender;
            return KGG_SPOUT_DIRECTX_UNAVAILABLE;
        }
        sender->spout.SetSenderFormat(DXGI_FORMAT_B8G8R8A8_UNORM);
        sender->spout.SetSenderName(name);
        copy_name(sender->spout.GetName(), actual_name, actual_name_capacity);
        *out_sender = sender;
        return KGG_SPOUT_OK;
    } catch (...) {
        delete sender;
        return KGG_SPOUT_INTERNAL_ERROR;
    }
}

extern "C" int kgg_spout_send_rgba(
    kgg_spout_sender* sender,
    const uint8_t* rgba,
    size_t length,
    uint32_t width,
    uint32_t height,
    int bottom_up) {
    if (!sender || !rgba) return KGG_SPOUT_INVALID_ARGUMENT;
    if (width == 0 || height == 0 || width > kMaxDimension || height > kMaxDimension) {
        return KGG_SPOUT_INVALID_ARGUMENT;
    }
    const size_t expected = static_cast<size_t>(width) * static_cast<size_t>(height) * 4;
    if (length != expected) return KGG_SPOUT_INVALID_ARGUMENT;

    try {
        if (sender->staging.size() != expected) sender->staging.resize(expected);
        convert_rgba_to_bgra(rgba, sender->staging.data(), width, height, bottom_up != 0);
        const bool sent = sender->spout.SendImage(sender->staging.data(), width, height, width * 4);
        return sent ? KGG_SPOUT_OK : KGG_SPOUT_SEND_FAILED;
    } catch (const std::bad_alloc&) {
        return KGG_SPOUT_INTERNAL_ERROR;
    } catch (...) {
        return KGG_SPOUT_INTERNAL_ERROR;
    }
}

extern "C" void kgg_spout_release(kgg_spout_sender* sender) {
    if (!sender) return;
    try {
        sender->spout.ReleaseSender();
    } catch (...) {
        // The destructor below still closes DirectX; never unwind into Rust.
    }
    try {
        delete sender;
    } catch (...) {
    }
}

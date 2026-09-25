// K-GG Spout output C ABI.
//
// Thin boundary between the Rust crate and Spout2's SpoutDX C++ class. Rust
// never sees C++ types or exceptions; every entry point returns a status code.
// A sender handle must be used from one thread at a time.
#pragma once

#include <stddef.h>
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct kgg_spout_sender kgg_spout_sender;

enum {
    KGG_SPOUT_OK = 0,
    KGG_SPOUT_INVALID_ARGUMENT = 1,
    KGG_SPOUT_DIRECTX_UNAVAILABLE = 2,
    KGG_SPOUT_SEND_FAILED = 3,
    KGG_SPOUT_INTERNAL_ERROR = 4,
};

// Opens a DirectX 11 device and reserves `name` for a new sender. If another
// sender already uses the name, Spout appends "_1", "_2", ... and the name
// that will be registered is written to `actual_name` (NUL-terminated).
// The sender becomes visible to receivers on the first successful send.
int kgg_spout_create(
    const char* name,
    kgg_spout_sender** out_sender,
    char* actual_name,
    uint32_t actual_name_capacity);

// Sends one 8-bit RGBA frame. `rgba` must hold exactly width * height * 4
// bytes with tightly packed rows. When `bottom_up` is non-zero the first row
// is the bottom of the image (WebGL readPixels order). The frame is converted
// to top-down BGRA in a reusable staging buffer before SpoutDX::SendImage.
// A size change updates the shared texture of the same sender.
int kgg_spout_send_rgba(
    kgg_spout_sender* sender,
    const uint8_t* rgba,
    size_t length,
    uint32_t width,
    uint32_t height,
    int bottom_up);

// Unregisters the sender, closes the DirectX device and frees the handle.
// Accepts NULL.
void kgg_spout_release(kgg_spout_sender* sender);

#ifdef __cplusplus
}
#endif

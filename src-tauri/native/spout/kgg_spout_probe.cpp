// Test-only Spout probe used by the Windows integration test in
// src-tauri/src/spout_output.rs. It opens a registered sender's shared DX11
// texture directly and copies the top-down BGRA bytes to the caller. It is not
// referenced by the application and is removed by the linker from app builds.
#include <cstring>

#include "SpoutDX.h"
#include "kgg_spout.h"

enum {
    KGG_SPOUT_PROBE_NOT_FOUND = 5,
};

extern "C" int kgg_spout_probe_read_sender(
    const char* name,
    uint8_t* out_bgra,
    size_t length,
    uint32_t* out_width,
    uint32_t* out_height,
    uint32_t* out_format) {
    if (!name || !out_width || !out_height || !out_format) return KGG_SPOUT_INVALID_ARGUMENT;
    try {
        spoutSenderNames names;
        unsigned int width = 0;
        unsigned int height = 0;
        HANDLE share_handle = nullptr;
        DWORD format = 0;
        if (!names.GetSenderInfo(name, width, height, share_handle, format) || !share_handle) {
            return KGG_SPOUT_PROBE_NOT_FOUND;
        }
        *out_width = width;
        *out_height = height;
        *out_format = format;
        const size_t row_bytes = static_cast<size_t>(width) * 4;
        if (!out_bgra || length != row_bytes * height) return KGG_SPOUT_INVALID_ARGUMENT;

        ID3D11Device* device = nullptr;
        ID3D11DeviceContext* context = nullptr;
        if (FAILED(D3D11CreateDevice(nullptr, D3D_DRIVER_TYPE_HARDWARE, nullptr, 0, nullptr, 0,
                                     D3D11_SDK_VERSION, &device, nullptr, &context))) {
            return KGG_SPOUT_DIRECTX_UNAVAILABLE;
        }
        int status = KGG_SPOUT_SEND_FAILED;
        ID3D11Texture2D* shared = nullptr;
        ID3D11Texture2D* staging = nullptr;
        if (SUCCEEDED(device->OpenSharedResource(share_handle, __uuidof(ID3D11Texture2D),
                                                 reinterpret_cast<void**>(&shared)))) {
            D3D11_TEXTURE2D_DESC desc = {};
            shared->GetDesc(&desc);
            desc.Usage = D3D11_USAGE_STAGING;
            desc.BindFlags = 0;
            desc.CPUAccessFlags = D3D11_CPU_ACCESS_READ;
            desc.MiscFlags = 0;
            if (SUCCEEDED(device->CreateTexture2D(&desc, nullptr, &staging))) {
                context->CopyResource(staging, shared);
                D3D11_MAPPED_SUBRESOURCE mapped = {};
                if (SUCCEEDED(context->Map(staging, 0, D3D11_MAP_READ, 0, &mapped))) {
                    const auto* source = static_cast<const uint8_t*>(mapped.pData);
                    for (unsigned int y = 0; y < height; ++y) {
                        std::memcpy(out_bgra + y * row_bytes, source + static_cast<size_t>(y) * mapped.RowPitch, row_bytes);
                    }
                    context->Unmap(staging, 0);
                    status = KGG_SPOUT_OK;
                }
                staging->Release();
            }
            shared->Release();
        }
        context->Release();
        device->Release();
        return status;
    } catch (...) {
        return KGG_SPOUT_INTERNAL_ERROR;
    }
}

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#[cfg(windows)]
#[no_mangle]
pub static NvOptimusEnablement: u32 = 1;

#[cfg(windows)]
#[no_mangle]
pub static AmdPowerXpressRequestHighPerformance: u32 = 1;

fn main() {
    kagaribi_grad_lib::run()
}

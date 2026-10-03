/** 左サイドバーの幅（px）。Presetが4列を並べられる広さまで拡げ、狭い画面でも縮められるようにする。 */
export const LEFT_PANEL_MIN_WIDTH = 200;
export const LEFT_PANEL_MAX_WIDTH = 720;
export const RIGHT_PANEL_MIN_WIDTH = 240;
export const RIGHT_PANEL_MAX_WIDTH = 600;

/** ウィンドウ幅に対して左サイドバーが占めてよい割合。プレビューを潰さないために上限を設ける。 */
const LEFT_PANEL_MAX_VIEWPORT_RATIO = 0.6;

/** 左サイドバー幅を、固定の範囲とウィンドウ幅に応じた上限へ収める。 */
export function clampLeftPanelWidth(width: number, viewportWidth: number): number {
  const viewportMax = Math.floor(viewportWidth * LEFT_PANEL_MAX_VIEWPORT_RATIO);
  const max = Math.max(LEFT_PANEL_MIN_WIDTH, Math.min(LEFT_PANEL_MAX_WIDTH, viewportMax));
  return Math.max(LEFT_PANEL_MIN_WIDTH, Math.min(max, width));
}

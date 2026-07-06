/**
 * 素材上传模式默认值。
 *
 * Seedance / 天玑等生成流程把本地素材转公网 URL 时的默认上传通道与
 * 默认自定义公链上传配置（litterbox 匿名图床，1 小时有效期）。
 */

/** 默认上传模式：custom（走自定义公链上传配置）。 */
export const WANJUAN_DEFAULT_SEEDANCE_UPLOAD_MODE = `custom`;

/** 默认的自定义公链上传配置（litterbox 匿名图床）。 */
export const WANJUAN_DEFAULT_CUSTOM_PUBLIC_UPLOAD_CONFIG = Object.freeze({
  endpoint: `https://litterbox.catbox.moe/resources/internals/api.php`,
  fileField: `fileToUpload`,
  fields: `reqtype=fileupload
time=1h`,
  headers: ``,
  resultPath: ``,
});

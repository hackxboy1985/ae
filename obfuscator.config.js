// obfuscator.config.js
module.exports = {
  // 保留的全局变量/函数（字符串或正则表达式）
  reservedNames: [
    // 例：保留全局函数 initEditor、全局变量 appConfig
    'init'
  ],
  // 其他混淆选项（按需配置）
  compact: true,          // 压缩代码
  selfDefending: true,    // 反调试保护
  stringArray: true,      // 加密字符串

  stringArrayEncoding: ['base64'], // 字符串加密方式

  // 关键配置：强制混淆顶层（全局）变量和函数
  mangle: {
    topLevel: true, // 启用全局变量混淆（默认false）
    keepFnames: false, // 不保留函数名（若需要混淆函数名）
    properties: {          // 同时混淆对象属性（可选，视情况开启）
      mode: 'unsafe',      // 激进模式（可能影响DOM属性，谨慎使用）
      reservedNames: ['init']    // 不保留任何属性名
    }
  },

  deadCodeInjection: false // 关闭垃圾代码（避免体积过大）
};
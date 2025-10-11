const fs = require('fs');
const path = require('path');
const { obfuscate } = require('javascript-obfuscator');

// 配置文件路径
const configPath = path.join(__dirname, 'obfuscator.config.js');
// 源文件目录
const srcDir = path.join(__dirname, 'js');
// 输出目录
const distDir = path.join(__dirname, 'dist');

// 确保输出目录存在
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// 读取混淆配置
const obfuscatorConfig = require(configPath);

// 获取所有JS文件
const jsFiles = fs.readdirSync(srcDir)
  .filter(file => path.extname(file) === '.js')
  .map(file => path.join(srcDir, file));

// 批量混淆处理
jsFiles.forEach(filePath => {
  try {
    // 获取输出文件路径
    const fileName = path.basename(filePath);
    const outputPath = path.join(distDir, fileName);


    if(filePath.includes('api.js')) {
        // 拷贝原始文件到输出目录（重命名为原文件名加上.bak后缀）
        // const backupPath = path.join(distDir, `${fileName}.bak`);
        fs.copyFileSync(filePath, outputPath);
        return;
    }
    console.log('混淆', filePath, outputPath)

    // 读取文件内容
    const code = fs.readFileSync(filePath, 'utf8');
    
    // 混淆代码
    const obfuscatedCode = obfuscate(code, obfuscatorConfig);
    

    

    // 写入混淆后的文件
    fs.writeFileSync(outputPath, obfuscatedCode.getObfuscatedCode());
    console.log(`✅ 成功处理: ${fileName}`);
  } catch (error) {
    console.error(`❌ 处理失败 ${path.basename(filePath)}:`, error.message);
  }
});

console.log('批量混淆完成！');

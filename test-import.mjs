// 简单的导入测试脚本
import { loadImageWithCORS, round } from './utils.mjs';

console.log('测试模块导入结果:');
console.log('loadImageWithCORS 函数:', typeof loadImageWithCORS);
console.log('round 函数:', typeof round);
console.log('round 函数测试:', round(123.456));

// 如果导入成功，可以尝试用一个测试图片URL调用loadImageWithCORS
if (typeof loadImageWithCORS === 'function') {
  console.log('尝试使用loadImageWithCORS加载测试图片');
  const testImg = loadImageWithCORS(
    'https://via.placeholder.com/150',
    (img) => console.log('图片加载成功:', img),
    () => console.log('图片加载失败')
  );
}
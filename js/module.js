// 模块类定义
class Module {
    constructor(imageId, imageModuleId) {
        this.imageId = imageId;
        this.imageModuleId = imageModuleId;
    }
}

// 图像项类定义
class ImageItem {
    constructor(id, src, name) {
        this.id = id;
        this.src = src;
        this.name = name;
        this.image = new Image();
        this.image.src = src;
        this.modulesList = []; // 存储从这张图片上裁剪出的模块
    }
}

// 帧模块类定义
class FrameModule {
    constructor(module, x = 0, y = 0, flag = 0) {
        this.module = module;
        this.x = x;
        this.y = y;
        this.flag = flag; // 0: 正常, 1: 水平翻转, 2: 垂直翻转, 4: 90度旋转
    }
    
    draw(ctx, sprite, originX, originY) {
        const imageItem = sprite.getImage(this.module.imageId);
        if (!imageItem || !imageItem.image.complete) return;
        
        const rectModule = imageItem.modulesList[this.module.imageModuleId];
        if (!rectModule) return;
        
        ctx.save();
        
        // 移动到原点 - 与ActionEditor相同的原点逻辑
        // 将图像中心与原点对齐
        ctx.translate(originX + this.x, originY - this.y);
        
        // 应用变换
        if (this.flag & 4) { // 90度旋转
            ctx.rotate(Math.PI / 2);
        }
        
        // 应用缩放（如果有）
        let scaleX = 1;
        let scaleY = 1;
        
        // 应用用户设置的缩放比例
        if (this.scale) {
            scaleX = this.scale.x;
            scaleY = this.scale.y;
        }
        
        // 应用翻转
        if (this.flag & 1) { // 水平翻转
            scaleX = -scaleX;
        }
        if (this.flag & 2) { // 垂直翻转
            scaleY = -scaleY;
        }
        
        ctx.scale(scaleX, scaleY);
        
        // 绘制图像 - 与ActionEditor相同的原点逻辑
        // 将图像中心与原点对齐后绘制
        const width = rectModule.width;
        const height = rectModule.height;
        const drawX = -width / 2;
        const drawY = -height / 2;

        // console.log('drawX:',drawX,drawY);
        // console.log('drawModule', this.module.imageId, this.module.imageModuleId, this.x, this.y, this.flag, scaleX, scaleY);
        ctx.drawImage(
            imageItem.image,
            rectModule.x, rectModule.y,
            width, height,
            0, 0,
            width, height
        );
        
        ctx.restore();
    }
    
    clone() {
        const cloned = new FrameModule(
            new Module(this.module.imageId, this.module.imageModuleId),
            this.x,
            this.y,
            this.flag
        );
        
        // 复制缩放属性
        if (this.scale) {
            cloned.scale = { ...this.scale };
        }
        
        return cloned;
    }
}
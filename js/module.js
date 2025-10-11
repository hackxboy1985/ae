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
    
    constructor(module, x = 0, y = 0, flag = 0, scale = 1, angle = 0) {
        this.module = module;
        this.x = x;
        this.y = y;
        this.flag = flag; // 0: 正常, 1: 水平翻转, 2: 垂直翻转, 4: 90度旋转
        this.scale = scale; // 缩放比例 1
        this.angle = angle; // 旋转角度（弧度）
    }
    
    draw(ctx, sprite, originX, originY, globalFlag = 0,globalScale = 1, globalAngle=0) {

        const imageItem = sprite.getImage(this.module.imageId);
        if (!imageItem || !imageItem.image.complete) return;
        
        const rectModule = imageItem.modulesList[this.module.imageModuleId];
        if (!rectModule) return;
        // 应用变换
        const x = rectModule.x;
        const y = rectModule.y;
        const width = rectModule.width;
        const height = rectModule.height;

        const rotateOrigin = { x:originX,y:originY};
        const config = {
            source: { x: x, y: y, width: width, height: height },
            drawPosition: { x: this.x, y: -this.y, width: width, height: height },  // 相对于旋转原点的位置
            flipX: (this.flag & 1) !== 0,  // 自身水平翻转
            flipY: (this.flag & 2) !== 0,  // 自身垂直翻转
            selfRotate: this.angle, // 自身旋转角度（弧度）
            color: 'blue',
            drawInfo: false,
        };
        DrawApi.drawAPI(ctx,rotateOrigin,config,imageItem.image,globalFlag===1,globalScale,globalAngle);
    }

    drawold(ctx, sprite, originX, originY, globalFlag = 0,globalScale = 1, globalAngle=0) {
        const imageItem = sprite.getImage(this.module.imageId);
        if (!imageItem || !imageItem.image.complete) return;
        
        const rectModule = imageItem.modulesList[this.module.imageModuleId];
        if (!rectModule) return;
        // 应用变换
        const width = rectModule.width;
        const height = rectModule.height;

        let drawX = this.x * this.scale * globalScale;
        let drawY = this.y * this.scale * globalScale;
        let drawWidth = width * this.scale * globalScale;
        let drawHeight = height * this.scale * globalScale;

        // 1. 缩放
        // ctx.scale(globalScale * this.scale, globalScale * this.scale);
        // 2. 旋转
        // ctx.rotate(globalAngle + this.angle);

        ctx.save();
        
        // 移动到原点 - 与ActionEditor相同的原点逻辑
        // 2. 平移坐标系到图片中心（关键：所有变换围绕中心进行）
        const centerX = originX + drawX + drawWidth / 2;
        const centerY = originY - drawY + drawHeight / 2; //-y是因为坐标系统不同,要转换到左上角原点坐标系
        if(globalFlag & 1){ //水平镜像
            const centerX_FlipY = originX - (drawX + drawWidth / 2);
            //console.log('原点x:',originX,'this.x:',this.x,'width/2:',width/2,'算出的centerX:',centerX,'水平镜像的X',centerX_FlipY);
            ctx.translate(centerX_FlipY, centerY);
        }else{
            ctx.translate(centerX, centerY);
        }



        // 3. 应用旋转（先旋转，避免翻转影响旋转方向）
        if (this.angle !== 0) {
            // 确保角度是以弧度表示的
            const rotateRad = typeof this.angle === 'number' ? this.angle : 0;
            ctx.rotate(rotateRad);
        }
        //console.log('draw flag:',this.flag,'globalFlag:',globalFlag,'globalScale:',globalScale);
        // 4. 应用翻转和镜像
        // 首先应用模块自身的翻转
        if(this.flag != 0 || globalFlag != 0) {
            // 计算水平翻转状态：如果模块和全局参数中奇数个设置了水平翻转(bit 0)，最终就是翻转
            const isHorizontalFlip = ((this.flag & 1) !== 0) !== ((globalFlag & 1) !== 0);
            // 计算垂直翻转状态：如果模块和全局参数中奇数个设置了垂直翻转(bit 1)，最终就是翻转
            const isVerticalFlip = ((this.flag & 2) !== 0) !== ((globalFlag & 2) !== 0);
            
            let scaleX = isHorizontalFlip ? -1 : 1;
            let scaleY = isVerticalFlip ? -1 : 1;


            ctx.scale(scaleX, scaleY);
            //console.log(globalFlag,isHorizontalFlip,isVerticalFlip,scaleX,scaleY)
            //console.log('应用镜像/翻转: flag=',this.flag, 'globalFlag=', globalFlag, 'globalScale',globalScale, 'scaleX=', scaleX, 'scaleY=', scaleY);

        }

        // 5. 绘制图片（使用调整后的坐标）
        ctx.drawImage(
            imageItem.image,
            rectModule.x, rectModule.y,
            width, height,
            -drawWidth / 2,  // 相对于中心的X坐标
            -drawHeight / 2, // 相对于中心的Y坐标
            drawWidth, drawHeight
        );
        
        ctx.restore();
    }

    drawold(ctx, sprite, originX, originY) {
        const imageItem = sprite.getImage(this.module.imageId);
        if (!imageItem || !imageItem.image.complete) return;
        
        const rectModule = imageItem.modulesList[this.module.imageModuleId];
        if (!rectModule) return;
        
        ctx.save();
        
        // 移动到原点 - 与ActionEditor相同的原点逻辑
        ctx.translate(originX + this.x, originY - this.y);
        
        // 应用变换
        const width = rectModule.width;
        const height = rectModule.height;
        
        // 先移动到旋转中心（图像中心）

        
        // 应用任意角度旋转
        if (this.angle !== 0) {
            ctx.translate(width / 2, height / 2);
            ctx.rotate(this.angle);
            // 应用90度旋转标志
            // if (this.flag & 4) {
            //     ctx.rotate(Math.PI / 2);
            // }
            // 旋转后调整位置，使图像保持在原位置
            ctx.translate(-width / 2, -height / 2);
        }
        


        // 应用缩放（如果有）
        let scaleX = 1;
        let scaleY = 1;
        
        // 应用用户设置的缩放比例
        if (this.scale) {
            scaleX = this.scale;
            scaleY = this.scale;
        }
        
        // 应用翻转
        if (this.flag & 1) { // 水平翻转
            scaleX = -scaleX;
        }
        if (this.flag & 2) { // 垂直翻转
            scaleY = -scaleY;
        }
        
        ctx.scale(scaleX, scaleY);
        
        // 计算绘制位置，考虑翻转效果
        const drawX = (this.flag & 1) ? -width : 0;
        const drawY = (this.flag & 2) ? -height : 0;
        
        ctx.drawImage(
            imageItem.image,
            rectModule.x, rectModule.y,
            width, height,
            drawX, 
            drawY,
            width, height
        );
        
        ctx.restore();
    }
    
    clone() {
        const cloned = new FrameModule(
            new Module(this.module.imageId, this.module.imageModuleId),
            this.x,
            this.y,
            this.flag,
            this.scale,
            this.angle
        );
        
        return cloned;
    }
}

class DrawApi{

    /**
     * 
     * @param {*} ctx 
     * @param {*} rotateOrigin 
     * @param {*} config 这个y一定要转回canvas坐标系，因为canvas的y轴是向下的，所以绘制时传入的Y值要取负。
     *              相对于操作时取的是向上为正的Y坐标轴，
     *              而绘制时canvas要基于绘制的原点rotateOrigin是基于canvas坐标系的，
     *              所以要将config.drawPosition.y取负。
     *              比如：(x:10,y:20)这个是在操作时相对于rotateOrigin,但绘制时必须为(x:10,y:-20)
     * @param {*} img 
     * @param {*} globalFlipX 
     * @param {*} globalScale 
     * @param {*} globalRotate 
     */
    static drawAPI(ctx,rotateOrigin,config,img,globalFlipX=false,globalScale=1,globalRotate=0){
        ctx.save();

        // 1. 平移到旋转原点（Canvas中心）
        ctx.translate(rotateOrigin.x, rotateOrigin.y);

        // 2. 应用全局水平镜像（基于旋转原点）
        const globalScaleX = globalFlipX ? -1 : 1;
        ctx.scale(globalScaleX, 1);

        // 3. 应用全局缩放
        ctx.scale(globalScale, globalScale);

        // 4. 应用旋转（共享角度）
        const rotateRad = globalRotate * Math.PI / 180;
        ctx.rotate(rotateRad);

        // 5. 平移到配置项的相对位置
        ctx.translate(config.drawPosition.x, config.drawPosition.y);

        // 6. 自身旋转（围绕自身中心点，新增逻辑）
        if (config.selfRotate !== 0) {
            ctx.translate(config.drawPosition.width / 2, config.drawPosition.height / 2);
            const selfRotateRad = config.selfRotate * Math.PI / 180;
            ctx.rotate(selfRotateRad);
            ctx.translate(-config.drawPosition.width / 2, -config.drawPosition.height / 2);
        }

        // 7. 自身水平翻转（基于自身中心点，核心修改）
        if (config.flipX) {
            ctx.translate(config.drawPosition.width / 2, config.drawPosition.height / 2);
            ctx.scale(-1, 1);
            ctx.translate(-config.drawPosition.width / 2, -config.drawPosition.height / 2);
        }

        // 8. 自身垂直翻转（基于自身中心点，新增逻辑）
        if (config.flipY) {
            ctx.translate(config.drawPosition.width / 2, config.drawPosition.height / 2);
            ctx.scale(1, -1);
            ctx.translate(-config.drawPosition.width / 2, -config.drawPosition.height / 2);
        }

        // 9. 绘制截取的图片区域
        ctx.drawImage(
            img,
            config.source.x, config.source.y,
            config.source.width, config.source.height,
            0, 0,
            config.drawPosition.width, 
            config.drawPosition.height
        );

        if(config.drawInfo===true){
            // 绘制辅助边框（基于绘制宽高）
            ctx.strokeStyle = config.color;
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, config.drawPosition.width, config.drawPosition.height);
            
            // 标记自身中心点（基于绘制宽高）
            ctx.fillStyle = config.color;
            ctx.beginPath();
            ctx.arc(
                config.drawPosition.width / 2,  // 绘制区域中心点X
                config.drawPosition.height / 2, // 绘制区域中心点Y
                3, 0, 2 * Math.PI
            );
            ctx.fill();
        }
        

        ctx.restore();
    }
}
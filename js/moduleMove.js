// 向上移动模块一层
function moveModuleUp() {
    if (!currentFrame || selectedModuleIndex < 0) return;
    
    // 检查是否可以向上移动（不是最上层）
    if (selectedModuleIndex < currentFrame.fmList.length - 1) {
        const command = new ReorderFmCommand(currentFrame, selectedModuleIndex, selectedModuleIndex + 1);
        
        CommandManager.instance.addCommand(command);
        
        // 更新选中索引
        selectedModuleIndex++;
        
        renderCanvas(15); // 15表示模块层级调整
    }
}

// 向下移动模块一层
function moveModuleDown() {
    if (!currentFrame || selectedModuleIndex < 0) return;
    
    // 检查是否可以向下移动（不是最下层）
    if (selectedModuleIndex > 0) {
        const command = new ReorderFmCommand(currentFrame, selectedModuleIndex, selectedModuleIndex - 1);
        
        CommandManager.instance.addCommand(command);
        
        // 更新选中索引
        selectedModuleIndex--;
        
        renderCanvas(15); // 15表示模块层级调整
    }
}

// 添加模块重排序命令类
class ReorderFmCommand {
    constructor(frame, fromIndex, toIndex) {
        this.frame = frame;
        this.fromIndex = fromIndex;
        this.toIndex = toIndex;
        this.fm = frame.fmList[fromIndex];
        this.name = '调整模块层级';
    }
    
    execute() {
        this.redo();
    }
    
    redo() {
        // 实现重做逻辑
        if (this.fromIndex < this.toIndex) {
            // 向上移动
            [this.frame.fmList[this.fromIndex], this.frame.fmList[this.toIndex]] = 
            [this.frame.fmList[this.toIndex], this.frame.fmList[this.fromIndex]];
        } else {
            // 向下移动
            [this.frame.fmList[this.toIndex], this.frame.fmList[this.fromIndex]] = 
            [this.frame.fmList[this.fromIndex], this.frame.fmList[this.toIndex]];
        }
    }
    
    undo() {
        // 实现撤销逻辑（与重做相反）
        this.redo();
    }
}

// 添加键盘事件监听
function setupModuleMoveKeyboardShortcuts() {
    document.addEventListener('keydown', function(event) {
        // 检查是否按下了Ctrl键并且是Up或Down箭头键
        if (event.ctrlKey && event.key === 'ArrowUp') {
            event.preventDefault(); // 阻止默认行为
            moveModuleUp();
        } else if (event.ctrlKey && event.key === 'ArrowDown') {
            event.preventDefault(); // 阻止默认行为
            moveModuleDown();
        }
    });
}

// 初始化快捷键
setupModuleMoveKeyboardShortcuts();
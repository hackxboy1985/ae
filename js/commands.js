// 命令基类定义
class Command {
    execute() {}
    undo() {}
}

// 添加模块命令类定义
class AddModuleCommand extends Command {
    constructor(frame, frameModule) {
        super();
        this.frame = frame;
        this.frameModule = frameModule;
    }
    
    execute() {
        this.frame.fmList.push(this.frameModule);
    }
    
    undo() {
        const index = this.frame.fmList.indexOf(this.frameModule);
        if (index !== -1) {
            this.frame.fmList.splice(index, 1);
        }
    }
}

// 添加帧模块命令类定义
class AddFmCommand extends Command {
    constructor(frame, frameModule) {
        super();
        this.frame = frame;
        this.frameModule = frameModule;
    }
    
    execute() {
        this.frame.fmList.push(this.frameModule);
    }
    
    undo() {
        const index = this.frame.fmList.indexOf(this.frameModule);
        if (index !== -1) {
            this.frame.fmList.splice(index, 1);
        }
    }
}

// 变换帧模块命令类定义
class TransformFmCommand extends Command {
    constructor(frameModule, oldX, oldY, oldFlag) {
        super();
        this.frameModule = frameModule;
        this.oldX = oldX;
        this.oldY = oldY;
        this.oldFlag = oldFlag;
        this.oldScale = frameModule.scale ? frameModule.scale : null;
        this.newX = frameModule.x;
        this.newY = frameModule.y;  
        this.newFlag = frameModule.flag;
        this.newScale = frameModule.scale ? frameModule.scale : null;
    }
    
    execute() {
        this.frameModule.x = this.newX;
        this.frameModule.y = this.newY;
        this.frameModule.flag = this.newFlag;
        this.frameModule.scale = this.newScale ? this.newScale : null;
    }
    
    undo() {
        this.frameModule.x = this.oldX;
        this.frameModule.y = this.oldY;
        this.frameModule.flag = this.oldFlag;
        this.frameModule.scale = this.oldScale ? this.oldScale : null; 
    }
}

// 组合命令类定义 - 用于组合多个命令
class CompositeCommand extends Command {
    constructor() {
        super();
        this.commands = [];
    }
    
    addCommand(command) {
        this.commands.push(command);
    }
    
    execute() {
        for (const command of this.commands) {
            command.execute();
        }
    }
    
    undo() {
        // 反向执行撤销操作
        for (let i = this.commands.length - 1; i >= 0; i--) {
            this.commands[i].undo();
        }
    }
}

// 命令管理器类定义
class CommandManager {
    constructor() {
        this.commandStack = [];
        this.undoStack = [];
    }
    
    addCommand(command) {
        command.execute();
        this.commandStack.push(command);
        this.undoStack = []; // 清空撤销栈
    }
    
    undo() {
        if (this.commandStack.length === 0) return;
        
        const command = this.commandStack.pop();
        command.undo();
        this.undoStack.push(command);
    }
    
    redo() {
        if (this.undoStack.length === 0) return;
        
        const command = this.undoStack.pop();
        command.execute();
        this.commandStack.push(command);
    }
}
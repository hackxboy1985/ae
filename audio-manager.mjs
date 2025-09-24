/**
 * 音频管理器模块
 * 负责动画播放时的音频同步播放功能
 * 支持 mp3/wav/flac 等多种音频格式
 */

class AudioManager {
  constructor() {
    // 当前正在播放的音频对象列表
    this.activeAudios = new Map();
    // 音频缓存，避免重复加载
    this.audioCache = new Map();
    // 静音状态
    this.isMuted = false;
    // 音量控制
    this.volume = 1.0;
  }


  /**
   * 设置静音状态
   * @param {boolean} muted - 是否静音
   */
  setMuted(muted) {
    this.isMuted = muted;
    this.activeAudios.forEach(audio => {
      audio.muted = muted;
    });
  }

  /**
   * 设置音量
   * @param {number} volume - 音量值 (0.0 - 1.0)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.activeAudios.forEach(audio => {
      audio.volume = this.isMuted ? 0 : this.volume;
    });
  }

  /**
   * 检查并加载音频文件
   * @param {string} audioUrl - 音频文件URL
   * @returns {Promise<HTMLAudioElement>} 加载完成的音频对象
   */
  async loadAudio(audioUrl) {
    // 检查是否已经缓存
    if (this.audioCache.has(audioUrl)) {
      return this.audioCache.get(audioUrl);
    }

    return new Promise((resolve, reject) => {
      const audio = new Audio();
      
      // 设置音频属性
      audio.preload = 'auto';
      audio.volume = this.isMuted ? 0 : this.volume;
      audio.loop = false; // 明确设置为不循环播放
      
      // 监听加载完成事件
      audio.addEventListener('canplaythrough', () => {
        if (!this.audioCache.has(audioUrl)) {
          // 缓存音频对象
          this.audioCache.set(audioUrl, audio);
          resolve(audio);
        }
      });
      
      // 监听错误事件
      audio.addEventListener('error', (error) => {
        console.error('Failed to load audio:', audioUrl, error);
        reject(error);
      });
      
      // 设置音频源
      audio.src = audioUrl;
    });
  }

  isPlayIng(audioUrl, roleId){
      const audioId = roleId ? `${audioUrl}_${roleId}` : audioUrl;
      // 如果该音频已经在播放，则直接返回
      if (this.activeAudios.has(audioId)) {
        return true;
      }
      return false;
  }
  /**
   * 播放指定的音频
   * @param {string} audioUrl - 音频文件URL或文件名
   * @param {string} roleId - 角色ID（可选）
   * @param {number} startTime - 音频开始播放的时间点（秒），默认为0
   */
  async playAudio(audioUrl, roleId, startTime = 0) {
    try {
      // 生成唯一的音频ID
      const audioId = roleId ? `${audioUrl}_${roleId}` : audioUrl;
      
      
      // 确保audioUrl是有效的
      if (!audioUrl) {
        console.warn('Audio URL is empty or invalid');
        return null;
      }

      if (this.activeAudios.has(audioId)) {
        return null;
      }

      // 检查是否需要补充基础路径（如果audioUrl不是完整URL）
      let fullAudioUrl = audioUrl;
      if (!audioUrl.startsWith('http://') && !audioUrl.startsWith('https://')) {
        // 假设音频文件在audio目录下
        fullAudioUrl = `./audio/${audioUrl}`;
        return null;
      }
      //console.log('play audio', audioId);
      // 加载音频
      const audio = await this.loadAudio(fullAudioUrl);
      
      if (this.activeAudios.has(audioId)) {
        return null;
      }
      // 存储活动音频
      this.activeAudios.set(audioId, audio);

      // 设置音频开始播放的时间点
      audio.currentTime = startTime;
      // console.log('播放音频', audioId, '从', startTime, '秒开始');
      audio.loop = false;
      
      // 播放音频
      audio.play().catch(error => {
        console.error('Failed to play audio:', audioId, error);
        // 移除失败的音频
        this.activeAudios.delete(audioId);
      });
      
      // 设置音频结束时的处理
      const handleAudioEnd = () => {
        console.log('play finish', audioId);
        this.activeAudios.delete(audioId);
        audio.removeEventListener('ended', handleAudioEnd);
      };
      
      audio.addEventListener('ended', handleAudioEnd);
      
      return audio;
    } catch (error) {
      console.error('Error playing audio:', audioUrl, error);
    }
  }

  /**
   * 停止指定的音频
   * @param {string} audioUrl - 音频文件URL或文件名
   * @param {string} roleId - 角色ID（可选）
   */
  stopAudio(audioUrl, roleId) {
    const audioId = roleId ? `${audioUrl}_${roleId}` : audioUrl;
    if (this.activeAudios.has(audioId)) {
      const audio = this.activeAudios.get(audioId);
      audio.pause();
      audio.currentTime = 0;
      this.activeAudios.delete(audioId);
      // console.log('stop audio', audioId);
    }
  }

  /**
   * 停止所有正在播放的音频
   */
  stopAllAudios(startTime=0) {
    this.activeAudios.forEach((audio, audioId) => {
      audio.pause();
      audio.currentTime = 0;
    });
    // console.log('stop all audios at time:',startTime);
    this.activeAudios.clear();
  }


  /**
   * 清理资源
   */
  cleanup() {
    this.stopAllAudios();
    //this.audioCache.clear();
  }
}

// 导出类
export default AudioManager;
<template>
    <div class="batch-download-page">
        <div class="batch-download-header">
            <h1>专辑批量下载</h1>
            <div class="batch-download-info">
                <p>输入专辑ID列表，每行一个，支持多专辑批量下载</p>
            </div>
        </div>
        
        <div class="batch-download-content">
            <div class="batch-download-form">
                <div class="form-group">
                    <label for="albumIds">专辑ID列表：</label>
                    <textarea 
                        id="albumIds" 
                        v-model="albumIds" 
                        placeholder="请输入专辑ID，每行一个"
                        rows="5"
                    ></textarea>
                </div>
                
                <div class="form-group">
                    <label for="quality">下载音质：</label>
                    <select id="quality" v-model="quality">
                        <option value="flac">FLAC (无损)</option>
                        <option value="320">320kbps</option>
                        <option value="128">128kbps</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label for="interval">下载间隔区间 (秒)：</label>
                    <div class="interval-range">
                        <input 
                            type="number" 
                            id="minInterval" 
                            v-model.number="minInterval" 
                            min="0" 
                            max="60"
                            placeholder="最小值"
                            class="interval-input"
                        >
                        <span class="interval-separator">-</span>
                        <input 
                            type="number" 
                            id="maxInterval" 
                            v-model.number="maxInterval" 
                            min="0" 
                            max="60"
                            placeholder="最大值"
                            class="interval-input"
                        >
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="pushplusToken">PushPlus Token (可选)：</label>
                    <input 
                        type="text" 
                        id="pushplusToken" 
                        v-model="pushplusToken" 
                        placeholder="用于下载完成通知"
                    >
                </div>
                
                <div class="form-group">
                    <label for="namingFormat">命名方式：</label>
                    <select id="namingFormat" v-model="namingFormat">
                        <option value="song-artist">歌曲名 - 歌手 (默认)</option>
                        <option value="artist-song">歌手 - 歌曲名</option>
                    </select>
                </div>
                
                <button 
                    class="start-download-btn" 
                    @click="startBatchDownload"
                    :disabled="isDownloading"
                >
                    {{ isDownloading ? '下载中...' : '开始下载' }}
                </button>
                
                <button 
                    class="stop-download-btn" 
                    @click="stopDownload"
                    :disabled="!isDownloading"
                >
                    停止下载
                </button>
            </div>
            
            <div class="download-progress" v-if="downloadProgress.length > 0">
                <h3>下载进度</h3>
                <div class="countdown-container" v-if="countdown > 0">
                    <div class="countdown-timer">
                        <span class="countdown-label">下一首开始下载:</span>
                        <span class="countdown-value">{{ countdown }}s</span>
                    </div>
                </div>
                <div class="progress-list">
                    <div 
                        v-for="(item, index) in downloadProgress" 
                        :key="index"
                        class="progress-item"
                        :class="{ 'expanded': expandedAlbums.includes(item.albumId) }"
                    >
                        <div 
                            class="album-header" 
                            @click="toggleAlbumExpand(item.albumId)"
                        >
                            <span class="album-title">{{ item.albumName }}</span>
                            <span class="album-status">{{ item.status }}</span>
                            <span class="expand-icon">{{ expandedAlbums.includes(item.albumId) ? '▼' : '▶' }}</span>
                        </div>
                        <div class="songs-list" v-if="expandedAlbums.includes(item.albumId)">
                            <div 
                                v-for="(song, songIndex) in item.songs" 
                                :key="songIndex"
                                class="song-item"
                            >
                                <span class="song-name">{{ song.name }}</span>
                                <span class="song-status">{{ song.status }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { MoeAuthStore } from '@/stores/store';
import { get, post } from '@/utils/request';

const MoeAuth = MoeAuthStore();
const albumIds = ref('');
const quality = ref('320');
const minInterval = ref(5);
const maxInterval = ref(10);
const pushplusToken = ref('');
const namingFormat = ref('song-artist');
const isDownloading = ref(false);
const downloadProgress = ref([]);
const expandedAlbums = ref([]);
const downloadAbortController = ref(null);
const countdown = ref(0);

// 从本地存储加载配置
onMounted(() => {
    const savedQuality = localStorage.getItem('batchDownloadQuality');
    const savedMinInterval = localStorage.getItem('batchDownloadMinInterval');
    const savedMaxInterval = localStorage.getItem('batchDownloadMaxInterval');
    const savedToken = localStorage.getItem('pushplusToken');
    const savedNamingFormat = localStorage.getItem('batchDownloadNamingFormat');
    
    if (savedQuality) quality.value = savedQuality;
    
    // 确保最小间隔默认值为5秒
    if (savedMinInterval) {
        let value = parseInt(savedMinInterval);
        // 如果值大于60，可能是之前保存的毫秒值，转换为秒
        if (value > 60) {
            value = Math.floor(value / 1000);
        }
        // 确保值在合理范围内
        minInterval.value = Math.max(0, Math.min(60, value));
    } else {
        minInterval.value = 5;
    }
    
    // 确保最大间隔默认值为10秒
    if (savedMaxInterval) {
        let value = parseInt(savedMaxInterval);
        // 如果值大于60，可能是之前保存的毫秒值，转换为秒
        if (value > 60) {
            value = Math.floor(value / 1000);
        }
        // 确保值在合理范围内
        maxInterval.value = Math.max(0, Math.min(60, value));
    } else {
        maxInterval.value = 10;
    }
    
    if (savedToken) pushplusToken.value = savedToken;
    if (savedNamingFormat) namingFormat.value = savedNamingFormat;
});

// 保存配置到本地存储
const saveConfig = () => {
    localStorage.setItem('batchDownloadQuality', quality.value);
    localStorage.setItem('batchDownloadMinInterval', minInterval.value.toString());
    localStorage.setItem('batchDownloadMaxInterval', maxInterval.value.toString());
    localStorage.setItem('pushplusToken', pushplusToken.value);
    localStorage.setItem('batchDownloadNamingFormat', namingFormat.value);
};

// 切换专辑展开状态
const toggleAlbumExpand = (albumId) => {
    const index = expandedAlbums.value.indexOf(albumId);
    if (index > -1) {
        expandedAlbums.value.splice(index, 1);
    } else {
        expandedAlbums.value.push(albumId);
    }
};

// 生成随机下载间隔（秒转换为毫秒）
const getRandomInterval = () => {
    const min = minInterval.value || 0;
    const max = maxInterval.value || 0;
    if (min <= 0 && max <= 0) return 0;
    if (min >= max) return min * 1000;
    const randomSeconds = Math.floor(Math.random() * (max - min + 1)) + min;
    return randomSeconds * 1000;
};

// 带倒计时的等待函数
const waitWithCountdown = async (ms) => {
    if (ms <= 0) return;
    
    const seconds = Math.ceil(ms / 1000);
    countdown.value = seconds;
    
    return new Promise(resolve => {
        const intervalId = setInterval(() => {
            countdown.value--;
            if (countdown.value <= 0) {
                clearInterval(intervalId);
                countdown.value = 0;
                resolve();
            }
        }, 1000);
    });
};

// 发送通知
const sendNotification = async (title, content) => {
    if (!pushplusToken.value) return;
    
    try {
        await fetch('https://www.pushplus.plus/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: pushplusToken.value,
                title: title,
                content: content,
                template: 'html'
            })
        });
    } catch (error) {
        console.error('发送通知失败:', error);
    }
};

// 下载单个歌曲
const downloadSingleSong = async (songId, songName, albumName, artistName = '', coverUrl = '') => {
    try {
        // 构建下载参数
        const downloadParams = {
            hash: songId,
            quality: quality.value
        };
        
        // 未登录用户添加free_part参数
        if (!MoeAuth.isAuthenticated) {
            downloadParams.free_part = 1;
        }
        
        // 获取下载链接（使用GET请求，与PlayerControl.vue保持一致）
        const data = await get('/song/url', downloadParams);
        console.log('获取下载链接响应:', data);
        
        let downloadUrl = null;
        if (data) {
            if (data.status === 1 && data.url && Array.isArray(data.url)) {
                downloadUrl = data.url[0];
            } else if (data.data && data.data.data) {
                if (data.data.data.url) {
                    downloadUrl = data.data.data.url;
                } else if (Array.isArray(data.data.data) && data.data.data[0]?.url) {
                    downloadUrl = data.data.data[0].url;
                } else if (data.data.data.list && data.data.data.list[0]?.url) {
                    downloadUrl = data.data.data.list[0].url;
                } else if (data.data.data.audio_data && data.data.data.audio_data.url) {
                    downloadUrl = data.data.data.audio_data.url;
                }
            }
        }
        
        if (downloadUrl) {
            // 使用downloadWithMetadata函数来下载（与PlayerControl.vue保持一致）
            const { downloadWithMetadata } = await import('../utils/utils');
            
            const songInfo = {
                name: songName,
                author: artistName,
                album: albumName,
                cover: coverUrl,
                hash: songId
            };
            
            const downloadOptions = {
                quality: quality.value,
                includeCover: true,
                includeLyrics: true,
                namingFormat: namingFormat.value,
                onProgress: (message, progressValue) => {
                    console.log(`下载进度: ${progressValue}% - ${message}`);
                }
            };
            
            const result = await downloadWithMetadata(downloadUrl, songInfo, downloadOptions);
            
            if (result.success) {
                const blobUrl = URL.createObjectURL(result.blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = result.fileName || `${albumName} - ${songName}.${quality.value === 'flac' ? 'flac' : 'mp3'}`;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // 清理blob URL
                setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                
                return true;
            } else {
                console.error('下载失败:', result.error);
                return false;
            }
        } else {
            console.error('获取下载链接失败:', data);
            return false;
        }
    } catch (error) {
        console.error('下载歌曲失败:', error);
        return false;
    }
};

// 下载单个专辑
const downloadAlbum = async (albumId) => {
    try {
        // 获取专辑信息
        let albumData;
        let songs = [];
        
        try {
            // 首先获取专辑详情
            albumData = await get('/album/detail', { id: albumId });
            console.log('专辑详情API响应:', albumData);
            
            // 尝试获取专辑歌曲列表（使用较小的pagesize）
            console.log('尝试获取专辑歌曲列表:', albumId);
            const songsResponse = await get('/album/songs', {
                id: albumId,
                page: 1,
                pagesize: 50 // 使用和PlaylistDetail.vue相同的pagesize
            });
            console.log('专辑歌曲API响应:', songsResponse);
            console.log('专辑歌曲数据:', songsResponse.data);
            
            // 处理专辑歌曲响应
            if (songsResponse.status === 1) {
                if (songsResponse.data?.songs?.length) {
                    songs = songsResponse.data.songs;
                } else if (songsResponse.data?.list?.length) {
                    songs = songsResponse.data.list;
                } else if (songsResponse.data?.audios?.length) {
                    songs = songsResponse.data.audios;
                } else if (Array.isArray(songsResponse.data)) {
                    songs = songsResponse.data;
                }
            }
        } catch (error) {
            console.error('获取专辑信息失败:', error);
            // 即使获取歌曲失败，也要继续处理，因为专辑详情可能已经获取成功
        }
        
        // 灵活处理不同的响应结构
        let albumName = '未知专辑';
        let albumArtist = '未知艺术家';
        let albumCover = '';
        
        // 处理专辑详情响应
        if (albumData.status === 1 && albumData.data && albumData.data.length > 0) {
            const albumInfo = albumData.data[0];
            albumName = albumInfo.album_name || albumInfo.name || albumInfo.albumName || albumName;
            albumArtist = albumInfo.author_name || albumInfo.artist_name || albumInfo.singer_name || albumArtist;
            
            // 处理封面图，优先使用 sizable_cover 并替换 size 为 480
            if (albumInfo.sizable_cover) {
                albumCover = albumInfo.sizable_cover.replace('{size}', '480');
            } else if (albumInfo.cover) {
                albumCover = albumInfo.cover;
            } else if (albumInfo.pic) {
                albumCover = albumInfo.pic;
            }
        } else if (albumData.code === 200 && albumData.data) {
            albumName = albumData.data.name || albumData.data.album_name || albumData.data.albumName || albumName;
            albumArtist = albumData.data.author_name || albumData.data.artist_name || albumData.data.singer_name || albumArtist;
            
            // 处理封面图，优先使用 sizable_cover 并替换 size 为 480
            if (albumData.data.sizable_cover) {
                albumCover = albumData.data.sizable_cover.replace('{size}', '480');
            } else if (albumData.data.cover) {
                albumCover = albumData.data.cover;
            } else if (albumData.data.pic) {
                albumCover = albumData.data.pic;
            }
        }
        
        // 如果没有获取到歌曲，尝试从专辑详情中提取（如果有的话）
        if (!songs || songs.length === 0) {
            if (albumData.data?.songs?.length) {
                songs = albumData.data.songs;
            } else if (albumData.data[0]?.songs?.length) {
                songs = albumData.data[0].songs;
            }
        }
        
        // 确保歌曲列表存在
        if (!songs || songs.length === 0) {
            throw new Error('未找到专辑歌曲');
        }
        
        // 标准化歌曲数据结构
        console.log('原始歌曲数据:', songs);
        const standardizedSongs = songs.map(song => {
            // 处理不同的歌曲数据结构
            if (song.audio_info) {
                return {
                    id: song.id || song.audio_id || song.hash || song.audio_info.id || song.audio_info.audio_id || song.audio_info.hash,
                    name: song.name || song.title || song.songname || song.audio_name || song.audio_info.name || song.audio_info.title || song.audio_info.songname || song.audio_info.audio_name || song.base?.audio_name || '未知歌曲'
                };
            } else if (song.base) {
                // 处理包含 base 字段的歌曲数据
                return {
                    id: song.id || song.audio_id || song.hash || song.songid || song.song_id || song.base.audio_id || song.base.album_audio_id,
                    name: song.name || song.title || song.songname || song.audio_name || song.song_name || song.title_name || song.base.audio_name || '未知歌曲'
                };
            } else {
                // 尝试从更多可能的字段中提取歌曲名称
                return {
                    id: song.id || song.audio_id || song.hash || song.songid || song.song_id,
                    name: song.name || song.title || song.songname || song.audio_name || song.song_name || song.title_name || '未知歌曲'
                };
            }
        }).filter(song => song.id);
        
        console.log('标准化后的歌曲数据:', standardizedSongs);
        console.log('标准化后的歌曲名称:', standardizedSongs.map(song => song.name));
        
        if (standardizedSongs.length === 0) {
            throw new Error('未找到有效的歌曲ID');
        }
        
        // 添加专辑到进度列表
        console.log('创建专辑进度前的歌曲数据:', standardizedSongs);
        const albumProgress = {
            albumId,
            albumName,
            status: '下载中',
            songs: standardizedSongs.map(song => {
                console.log('添加到进度的歌曲:', song.id, song.name);
                return {
                    id: song.id,
                    name: song.name,
                    status: '等待下载'
                };
            })
        };
        
        downloadProgress.value.push(albumProgress);
        
        // 下载专辑中的歌曲
        for (let i = 0; i < standardizedSongs.length; i++) {
            if (!isDownloading.value) break;
            
            const song = standardizedSongs[i];
            const songIndex = albumProgress.songs.findIndex(s => s.id === song.id);
            
            if (songIndex > -1) {
                albumProgress.songs[songIndex].status = '下载中';
                
                // 下载歌曲（传递艺术家名称和封面）
                console.log('准备下载歌曲:', song.id, song.name);
                console.log('完整的歌曲对象:', song);
                const success = await downloadSingleSong(song.id, song.name, albumName, albumArtist, albumCover);
                
                if (success) {
                    albumProgress.songs[songIndex].status = '下载成功';
                } else {
                    albumProgress.songs[songIndex].status = '下载失败';
                }
                
                // 下载间隔
                if (i < standardizedSongs.length - 1) {
                    const randomInterval = getRandomInterval();
                    if (randomInterval > 0) {
                        console.log(`使用随机下载间隔: ${randomInterval}ms`);
                        await waitWithCountdown(randomInterval);
                    }
                }
            }
        }
        
        // 更新专辑状态
        const allSuccess = albumProgress.songs.every(song => song.status === '下载成功');
        const anySuccess = albumProgress.songs.some(song => song.status === '下载成功');
        
        if (allSuccess) {
            albumProgress.status = '全部下载成功';
        } else if (anySuccess) {
            albumProgress.status = '部分下载成功';
        } else {
            albumProgress.status = '全部下载失败';
        }
        
        return true;
    } catch (error) {
        console.error(`下载专辑 ${albumId} 失败:`, error);
        
        // 更新专辑状态
        const albumProgress = downloadProgress.value.find(item => item.albumId === albumId);
        if (albumProgress) {
            albumProgress.status = error.message || '获取专辑信息失败';
        } else {
            // 如果专辑进度还未添加，添加一个失败状态的条目
            downloadProgress.value.push({
                albumId,
                albumName: '未知专辑',
                status: error.message || '获取专辑信息失败',
                songs: []
            });
        }
        
        return false;
    }
};

// 开始批量下载
const startBatchDownload = async () => {
    // 验证输入
    if (!albumIds.value.trim()) {
        alert('请输入专辑ID');
        return;
    }
    
    // 保存配置
    saveConfig();
    
    // 准备下载
    isDownloading.value = true;
    downloadProgress.value = [];
    expandedAlbums.value = [];
    downloadAbortController.value = new AbortController();
    
    // 解析专辑ID列表
    const albumIdList = albumIds.value
        .split('\n')
        .map(id => id.trim())
        .filter(id => id);
    
    if (albumIdList.length === 0) {
        alert('请输入有效的专辑ID');
        isDownloading.value = false;
        return;
    }
    
    // 发送开始通知
    if (pushplusToken.value) {
        await sendNotification('批量下载开始', `开始下载 ${albumIdList.length} 个专辑`);
    }
    
    // 开始下载
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < albumIdList.length; i++) {
        if (!isDownloading.value) break;
        
        const albumId = albumIdList[i];
        const success = await downloadAlbum(albumId);
        
        if (success) {
            successCount++;
        } else {
            failCount++;
        }
        
        // 专辑间下载间隔
        if (i < albumIdList.length - 1) {
            const randomInterval = getRandomInterval();
            if (randomInterval > 0) {
                console.log(`使用随机专辑间间隔: ${randomInterval}ms`);
                await waitWithCountdown(randomInterval);
            }
        }
    }
    
    // 完成下载
    isDownloading.value = false;
    
    // 发送完成通知
    if (pushplusToken.value) {
        await sendNotification(
            '批量下载完成',
            `共下载 ${albumIdList.length} 个专辑，成功 ${successCount} 个，失败 ${failCount} 个`
        );
    }
    
    // 提示完成
    alert(`批量下载完成！\n成功：${successCount} 个专辑\n失败：${failCount} 个专辑`);
};

// 停止下载
const stopDownload = () => {
    isDownloading.value = false;
    
    if (downloadAbortController.value) {
        downloadAbortController.value.abort();
    }
    
    // 重置倒计时
    countdown.value = 0;
    
    // 更新所有下载中的项目状态
    downloadProgress.value.forEach(item => {
        if (item.status === '下载中') {
            item.status = '已停止';
        }
        
        item.songs.forEach(song => {
            if (song.status === '下载中') {
                song.status = '已停止';
            }
        });
    });
};
</script>

<style scoped>
.batch-download-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.batch-download-header {
    text-align: center;
    margin-bottom: 40px;
}

.batch-download-header h1 {
    font-size: 24px;
    margin-bottom: 10px;
    color: #333;
}

.batch-download-info p {
    color: #666;
    font-size: 14px;
}

.batch-download-content {
    display: flex;
    gap: 40px;
}

.batch-download-form {
    flex: 1;
    max-width: 500px;
}

.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: #333;
}

.form-group textarea,
.form-group select,
.form-group input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
}

.form-group textarea {
    resize: vertical;
}

/* 下载间隔区间样式 */
.interval-range {
    display: flex;
    align-items: center;
    gap: 10px;
}

.interval-input {
    flex: 1;
}

.interval-separator {
    font-size: 16px;
    font-weight: bold;
    color: #666;
}

/* 倒计时样式 */
.countdown-container {
    margin-bottom: 15px;
}

.countdown-timer {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 15px;
    background-color: #f0f8ff;
    border: 1px solid #b8e0ff;
    border-radius: 4px;
    font-size: 14px;
}

.countdown-label {
    color: #333;
}

.countdown-value {
    font-size: 16px;
    font-weight: bold;
    color: #4A90E2;
}

.start-download-btn,
.stop-download-btn {
    display: inline-block;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    margin-right: 10px;
}

.start-download-btn {
    background-color: #4CAF50;
    color: white;
}

.start-download-btn:hover {
    background-color: #45a049;
}

.start-download-btn:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
}

.stop-download-btn {
    background-color: #f44336;
    color: white;
}

.stop-download-btn:hover {
    background-color: #da190b;
}

.stop-download-btn:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
}

.download-progress {
    flex: 1;
    min-width: 400px;
}

.download-progress h3 {
    font-size: 18px;
    margin-bottom: 15px;
    color: #333;
}

.progress-list {
    border: 1px solid #ddd;
    border-radius: 4px;
    max-height: 500px;
    overflow-y: auto;
}

.progress-item {
    border-bottom: 1px solid #eee;
}

.progress-item:last-child {
    border-bottom: none;
}

.album-header {
    padding: 12px 15px;
    background-color: #f5f5f5;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.album-header:hover {
    background-color: #e9e9e9;
}

.album-title {
    font-weight: 500;
    flex: 1;
}

.album-status {
    margin: 0 15px;
    font-size: 12px;
    color: #666;
}

.expand-icon {
    font-size: 12px;
    color: #999;
}

.songs-list {
    padding: 10px 0;
    background-color: #fff;
}

.song-item {
    padding: 8px 25px;
    display: flex;
    justify-content: space-between;
    border-bottom: 1px solid #f0f0f0;
}

.song-item:last-child {
    border-bottom: none;
}

.song-name {
    flex: 1;
    font-size: 13px;
}

.song-status {
    font-size: 12px;
    color: #666;
}

@media (max-width: 768px) {
    .batch-download-content {
        flex-direction: column;
    }
    
    .batch-download-form,
    .download-progress {
        max-width: 100%;
        min-width: auto;
    }
}
</style>
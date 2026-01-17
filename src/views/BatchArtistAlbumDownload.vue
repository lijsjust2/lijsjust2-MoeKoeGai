<template>
    <div class="batch-artist-download-page">
        <div class="batch-download-header">
            <h1>歌手专辑批量下载</h1>
            <div class="batch-download-info">
                <p>输入歌手ID，获取该歌手的所有专辑并批量下载</p>
            </div>
        </div>
        
        <div class="batch-download-content">
            <div class="batch-download-form">
                <div class="form-group">
                    <label for="artistId">歌手ID：</label>
                    <input 
                        type="text" 
                        id="artistId" 
                        v-model="artistId" 
                        placeholder="请输入歌手ID"
                    >
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
                    <label for="interval">下载间隔 (毫秒)：</label>
                    <input 
                        type="number" 
                        id="interval" 
                        v-model.number="interval" 
                        min="0" 
                        max="5000"
                    >
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
                    <label>
                        <input type="checkbox" v-model="excludeConcertAlbums">
                        排除演唱会专辑
                    </label>
                </div>
                
                <div class="form-group">
                    <label for="namingFormat">命名格式：</label>
                    <select id="namingFormat" v-model="namingFormat">
                        <option value="album-song">专辑名 - 歌曲名</option>
                        <option value="song-album">歌曲名 - 专辑名</option>
                        <option value="song">仅歌曲名</option>
                    </select>
                </div>
                
                <button 
                    class="query-albums-btn" 
                    @click="queryArtistAlbums"
                    :disabled="isQuerying || isDownloading"
                >
                    {{ isQuerying ? '查询中...' : '查询专辑' }}
                </button>
                
                <button 
                    class="start-download-btn" 
                    @click="startBatchDownload"
                    :disabled="isDownloading || artistAlbums.length === 0"
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
            
            <div class="albums-list" v-if="artistAlbums.length > 0">
                <h3>专辑列表 ({{ artistAlbums.length }})</h3>
                <div class="albums-controls">
                    <label>
                        <input type="checkbox" v-model="selectAllAlbums" @change="toggleSelectAll">
                        全选
                    </label>
                </div>
                <div class="albums-grid">
                    <div 
                        v-for="album in artistAlbums" 
                        :key="album.id"
                        class="album-item"
                        :class="{ 'selected': selectedAlbums.includes(album.id) }"
                    >
                        <div class="album-checkbox">
                            <input 
                                type="checkbox" 
                                :value="album.id" 
                                v-model="selectedAlbums"
                            >
                        </div>
                        <div class="album-info">
                            <div class="album-name">{{ album.name }}</div>
                            <div class="album-year">{{ album.publishTime ? album.publishTime.substring(0, 4) : '未知年份' }}</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="download-progress" v-if="downloadProgress.length > 0">
                <h3>下载进度</h3>
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
const artistId = ref('');
const quality = ref('320');
const interval = ref(1000);
const pushplusToken = ref('');
const excludeConcertAlbums = ref(true);
const namingFormat = ref('album-song');
const isQuerying = ref(false);
const isDownloading = ref(false);
const artistAlbums = ref([]);
const selectedAlbums = ref([]);
const selectAllAlbums = ref(false);
const downloadProgress = ref([]);
const expandedAlbums = ref([]);
const downloadAbortController = ref(null);

// 从本地存储加载配置
onMounted(() => {
    const savedQuality = localStorage.getItem('batchDownloadQuality');
    const savedInterval = localStorage.getItem('batchDownloadInterval');
    const savedToken = localStorage.getItem('pushplusToken');
    const savedNamingFormat = localStorage.getItem('batchDownloadNamingFormat');
    const savedExcludeConcert = localStorage.getItem('batchDownloadExcludeConcert');
    
    if (savedQuality) quality.value = savedQuality;
    if (savedInterval) interval.value = parseInt(savedInterval);
    if (savedToken) pushplusToken.value = savedToken;
    if (savedNamingFormat) namingFormat.value = savedNamingFormat;
    if (savedExcludeConcert) excludeConcertAlbums.value = savedExcludeConcert === 'true';
});

// 保存配置到本地存储
const saveConfig = () => {
    localStorage.setItem('batchDownloadQuality', quality.value);
    localStorage.setItem('batchDownloadInterval', interval.value.toString());
    localStorage.setItem('pushplusToken', pushplusToken.value);
    localStorage.setItem('batchDownloadNamingFormat', namingFormat.value);
    localStorage.setItem('batchDownloadExcludeConcert', excludeConcertAlbums.value.toString());
};

// 切换全选状态
const toggleSelectAll = () => {
    if (selectAllAlbums.value) {
        selectedAlbums.value = artistAlbums.value.map(album => album.id);
    } else {
        selectedAlbums.value = [];
    }
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

// 格式化文件名
const formatFileName = (albumName, songName) => {
    switch (namingFormat.value) {
        case 'album-song':
            return `${albumName} - ${songName}`;
        case 'song-album':
            return `${songName} - ${albumName}`;
        case 'song':
            return songName;
        default:
            return `${albumName} - ${songName}`;
    }
};

// 下载单个歌曲
const downloadSingleSong = async (songId, songName, albumName) => {
    try {
        // 构建下载参数
        const downloadParams = {
            id: songId,
            level: quality.value
        };
        
        // 未登录用户添加free_part参数
        if (!MoeAuth.isAuthenticated) {
            downloadParams.free_part = 1;
        }
        
        // 获取下载链接
        const data = await post('/song/url', downloadParams);
        
        if (data.code === 200 && data.data.url) {
            // 创建下载链接并模拟点击
            const link = document.createElement('a');
            link.href = data.data.url;
            link.download = `${formatFileName(albumName, songName)}.${quality.value === 'flac' ? 'flac' : 'mp3'}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            return true;
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
        const albumData = await get('/album/detail', { id: albumId });
        
        if (albumData.code !== 200 || !albumData.data) {
            throw new Error('获取专辑信息失败');
        }
        
        const albumName = albumData.data.name;
        const songs = albumData.data.songs;
        
        // 添加专辑到进度列表
        const albumProgress = {
            albumId,
            albumName,
            status: '下载中',
            songs: songs.map(song => ({
                id: song.id,
                name: song.name,
                status: '等待下载'
            }))
        };
        
        downloadProgress.value.push(albumProgress);
        
        // 下载专辑中的歌曲
        for (let i = 0; i < songs.length; i++) {
            if (!isDownloading.value) break;
            
            const song = songs[i];
            const songIndex = albumProgress.songs.findIndex(s => s.id === song.id);
            
            if (songIndex > -1) {
                albumProgress.songs[songIndex].status = '下载中';
                
                // 下载歌曲
                const success = await downloadSingleSong(song.id, song.name, albumName);
                
                if (success) {
                    albumProgress.songs[songIndex].status = '下载成功';
                } else {
                    albumProgress.songs[songIndex].status = '下载失败';
                }
                
                // 下载间隔
                if (i < songs.length - 1 && interval.value > 0) {
                    await new Promise(resolve => setTimeout(resolve, interval.value));
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
            albumProgress.status = '获取专辑信息失败';
        }
        
        return false;
    }
};

// 查询歌手专辑
const queryArtistAlbums = async () => {
    if (!artistId.value.trim()) {
        alert('请输入歌手ID');
        return;
    }
    
    isQuerying.value = true;
    
    try {
        // 获取歌手专辑列表
        const data = await get('/artist/album', { id: artistId.value, limit: 100 });
        
        if (data.code === 200 && data.data && data.data.hotAlbums) {
            let albums = data.data.hotAlbums;
            
            // 排除演唱会专辑
            if (excludeConcertAlbums.value) {
                const concertKeywords = ['演唱会', '现场', 'Live', ' Concert', ' Live'];
                albums = albums.filter(album => 
                    !concertKeywords.some(keyword => 
                        album.name.includes(keyword)
                    )
                );
            }
            
            artistAlbums.value = albums;
            selectedAlbums.value = albums.map(album => album.id);
            selectAllAlbums.value = true;
            
            alert(`查询成功！找到 ${albums.length} 张专辑`);
        } else {
            alert('查询失败，请检查歌手ID是否正确');
            artistAlbums.value = [];
            selectedAlbums.value = [];
            selectAllAlbums.value = false;
        }
    } catch (error) {
        console.error('查询歌手专辑失败:', error);
        alert('查询失败，请稍后重试');
        artistAlbums.value = [];
        selectedAlbums.value = [];
        selectAllAlbums.value = false;
    } finally {
        isQuerying.value = false;
    }
};

// 开始批量下载
const startBatchDownload = async () => {
    if (selectedAlbums.value.length === 0) {
        alert('请先选择要下载的专辑');
        return;
    }
    
    // 保存配置
    saveConfig();
    
    // 准备下载
    isDownloading.value = true;
    downloadProgress.value = [];
    expandedAlbums.value = [];
    downloadAbortController.value = new AbortController();
    
    // 发送开始通知
    if (pushplusToken.value) {
        await sendNotification('批量下载开始', `开始下载 ${selectedAlbums.value.length} 个专辑`);
    }
    
    // 开始下载
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < selectedAlbums.value.length; i++) {
        if (!isDownloading.value) break;
        
        const albumId = selectedAlbums.value[i];
        const success = await downloadAlbum(albumId);
        
        if (success) {
            successCount++;
        } else {
            failCount++;
        }
        
        // 专辑间下载间隔
        if (i < selectedAlbums.value.length - 1 && interval.value > 0) {
            await new Promise(resolve => setTimeout(resolve, interval.value));
        }
    }
    
    // 完成下载
    isDownloading.value = false;
    
    // 发送完成通知
    if (pushplusToken.value) {
        await sendNotification(
            '批量下载完成',
            `共下载 ${selectedAlbums.value.length} 个专辑，成功 ${successCount} 个，失败 ${failCount} 个`
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
.batch-artist-download-page {
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
    flex-direction: column;
    gap: 40px;
}

.batch-download-form {
    max-width: 600px;
    margin: 0 auto;
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

.form-group input,
.form-group select {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
}

.form-group input[type="checkbox"] {
    width: auto;
    margin-right: 8px;
}

.query-albums-btn,
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
    margin-top: 10px;
}

.query-albums-btn {
    background-color: #2196F3;
    color: white;
}

.query-albums-btn:hover {
    background-color: #0b7dda;
}

.query-albums-btn:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
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

.albums-list {
    max-width: 1000px;
    margin: 0 auto;
}

.albums-list h3 {
    font-size: 18px;
    margin-bottom: 15px;
    color: #333;
}

.albums-controls {
    margin-bottom: 15px;
    padding: 10px;
    background-color: #f5f5f5;
    border-radius: 4px;
}

.albums-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
}

.album-item {
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 15px;
    background-color: #fff;
    display: flex;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s ease;
}

.album-item:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-color: #4CAF50;
}

.album-item.selected {
    background-color: #e8f5e8;
    border-color: #4CAF50;
}

.album-checkbox {
    margin-right: 15px;
}

.album-info {
    flex: 1;
}

.album-name {
    font-weight: 500;
    margin-bottom: 5px;
    color: #333;
}

.album-year {
    font-size: 12px;
    color: #666;
}

.download-progress {
    max-width: 1000px;
    margin: 0 auto;
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
    .batch-download-form {
        max-width: 100%;
    }
    
    .albums-grid {
        grid-template-columns: 1fr;
    }
    
    .query-albums-btn,
    .start-download-btn,
    .stop-download-btn {
        display: block;
        width: 100%;
        margin-right: 0;
        margin-bottom: 10px;
    }
}
</style>
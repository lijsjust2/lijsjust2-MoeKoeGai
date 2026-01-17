import i18n from '@/utils/i18n';

export const applyColorTheme = (theme) => {
    let colors;
    if (theme === 'blue') {
        colors = {
            '--primary-color': '#4A90E2',
            '--secondary-color': '#AEDFF7',
            '--background-color': '#E8F4FA',
            '--background-color-secondary': '#D9EEFA',
            '--color-primary': '#2A6DAF',
            '--color-primary-light': 'rgba(74, 144, 226, 0.1)',
            '--border-color': '#C5E0F5',
            '--hover-color': '#D1E9F9',
            '--color-secondary-bg-for-transparent': 'rgba(174, 223, 247, 0.28)',
            '--color-box-shadow': 'rgba(74, 144, 226, 0.2)',
        };
    } else if (theme === 'green') {
        colors = {
            '--primary-color': '#34C759',
            '--secondary-color': '#A7F3D0',
            '--background-color': '#E5F9F0',
            '--background-color-secondary': '#D0F5E6',
            '--color-primary': '#28A745',
            '--color-primary-light': 'rgba(52, 199, 89, 0.1)',
            '--border-color': '#B8ECD7',
            '--hover-color': '#C9F2E2',
            '--color-secondary-bg-for-transparent': 'rgba(167, 243, 208, 0.28)',
            '--color-box-shadow': 'rgba(52, 199, 89, 0.2)',
        };
    } else if (theme === 'orange') {
        colors = {
            '--primary-color': '#ff6b6b',
            '--secondary-color': '#FFB6C1',
            '--background-color': '#FFF0F5',
            '--background-color-secondary': '#FFE6EC',
            '--color-primary': '#ea33e4',
            '--color-primary-light': 'rgba(255, 107, 107, 0.1)',
            '--border-color': '#FFDCE3',
            '--hover-color': '#FFE9EF',
            '--color-secondary-bg-for-transparent': 'rgba(209, 209, 214, 0.28)',
            '--color-box-shadow': 'rgba(255, 105, 180, 0.2)',
        };
    } else {
        colors = {
            '--primary-color': '#FF69B4',
            '--secondary-color': '#FFB6C1',
            '--background-color': '#FFF0F5',
            '--background-color-secondary': '#FFE6F0',
            '--color-primary': '#ea33e4',
            '--color-primary-light': 'rgba(255, 105, 180, 0.1)',
            '--border-color': '#FFD9E6',
            '--hover-color': '#FFE9F2',
            '--color-secondary-bg-for-transparent': 'rgba(209, 209, 214, 0.28)',
            '--color-box-shadow': 'rgba(255, 105, 180, 0.2)',
        };
    }

    Object.keys(colors).forEach(key => {
        document.documentElement.style.setProperty(key, colors[key]);
    });
};


export const getCover = (coverUrl, size) => {
    if (!coverUrl) return './assets/images/ico.png';
    return coverUrl.replace("{size}", size);
};

export const getQuality = (hashs, data) => {
    const savedConfig = JSON.parse(localStorage.getItem('settings'));
    if (savedConfig?.quality === 'high') {
        if(hashs){
            return hashs[1]?.hash || hashs[0].hash;
        }
        return data['hash_320'] || data['hash_192'] || data['hash_128'] || data['hash'];
    } else if (savedConfig?.quality === 'lossless') {
        if(hashs){
            return hashs[hashs.length - 1]?.hash || hashs[1]?.hash || hashs[0].hash;
        }
        return data['hash_flac'] || data['hash_ape'] || data['hash'];
    } else if (savedConfig?.quality === 'hires') {
        if(hashs){
            return hashs[hashs.length - 1]?.hash;
        }
        return data['hash_flac'] || data['hash_sq'] || data['hash_ape'] || data['hash'];
    }
    if(hashs){
        return hashs[0].hash;
    }
    return data['hash'];
}

export const formatMilliseconds = (time) => {
    const milliseconds = time > 3600 ? time : time * 1000;
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}分${seconds}秒`;
};

let themeMediaQueryListener = null;
export const setTheme = (theme) => {
    const html = document.documentElement;
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');

    if (themeMediaQueryListener) {
        prefersDarkScheme.removeEventListener('change', themeMediaQueryListener);
        themeMediaQueryListener = null;
    }

    const applyTheme = (isDark) => {
        if (isDark) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
    };

    switch (theme) {
        case 'dark':
            applyTheme(true);
            localStorage.setItem('theme', 'dark');
            break;
        case 'light':
            applyTheme(false);
            localStorage.setItem('theme', 'light');
            break;
        case 'auto':
            localStorage.setItem('theme', 'auto');
            applyTheme(prefersDarkScheme.matches);
            themeMediaQueryListener = (e) => {
                applyTheme(e.matches);
            };
            prefersDarkScheme.addEventListener('change', themeMediaQueryListener);
            break;
    }
};

export const openRegisterUrl = (registerUrl) => {
    if (window.electron) {
        window.electron.ipcRenderer.send('open-url', registerUrl);
    } else {
        window.open(registerUrl, '_blank');
    }
};

// 分享
import { MoeAuthStore } from '../stores/store';
export const share = (songName, id, type = 0, songDesc = '') => {
    let text = '';
    const MoeAuth = MoeAuthStore();
    let userName = '萌音';
    if(MoeAuth.isAuthenticated) {
        userName = MoeAuth.UserInfo?.nickname || '萌音';
    };
    // 客户端分享
    let shareUrl = '';
    if (window.electron) {
        if(type == 0){
            // 歌曲
            shareUrl = `https://music.moekoe.cn/share/?hash=${id}`;
        }else{
            // 歌单
            shareUrl = `moekoe://share?listid=${id}`;
        }
    } else {
        //  Web / H5 逻辑
        shareUrl = (window.location.host + '/#/') + (type == 0 ? `share/?hash=${id}` : `share?listid=${id}`);
    }
    text = `你的好友@${userName}分享了${songDesc}《${songName}》给你,快去听听吧! ${shareUrl}`;

    navigator.clipboard.writeText(text);
    $message.success(
        i18n.global.t('kou-ling-yi-fu-zhi,kuai-ba-ge-qu-fen-xiang-gei-peng-you-ba')
    );
};

// 内嵌音乐元数据（封面图和歌词）
export const embedMusicMetadata = async (audioBlob, songInfo, coverUrl, lyrics) => {
    console.log('[embedMusicMetadata] 开始处理:', { songInfo, coverUrl: !!coverUrl, lyrics: !!lyrics });
    
    try {
        // 检查文件类型
        const fileType = audioBlob.type;
        console.log('[embedMusicMetadata] 文件类型:', fileType);
        
        // 获取音频数据
        const arrayBuffer = await audioBlob.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        console.log('[embedMusicMetadata] 音频数据转换完成，大小:', arrayBuffer.byteLength);
        
        // 检查是否是 FLAC 文件的多种方法
        const isFlacByHeader = uint8Array.subarray(0, 4).join(',') === '102,76,65,67'; // 'fLaC'  magic number
        const isFlacByName = audioBlob.name?.endsWith('.flac');
        const isFlacByType = fileType === 'audio/flac' || fileType.includes('flac');
        const isFlacByExtension = audioBlob.name?.toLowerCase().includes('.flac');
        
        console.log('[embedMusicMetadata] FLAC 文件检测:', {
            isFlacByHeader,
            isFlacByName,
            isFlacByType,
            isFlacByExtension,
            fileName: audioBlob.name
        });
        
        // 对于 FLAC 文件，使用 Vorbis Comments
        if (isFlacByHeader || isFlacByName || isFlacByType || isFlacByExtension) {
            console.log('[embedMusicMetadata] 处理 FLAC 文件，使用 Vorbis Comments');
            
            // 检查是否是有效的 FLAC 文件
            const isFlac = uint8Array.subarray(0, 4).join(',') === '102,76,65,67'; // 'fLaC'  magic number
            console.log('[embedMusicMetadata] FLAC 文件头检查:', {
                headerBytes: uint8Array.subarray(0, 4),
                headerString: String.fromCharCode(...uint8Array.subarray(0, 4)),
                isFlac: isFlac
            });
            if (!isFlac) {
                console.warn('[embedMusicMetadata] 不是有效的 FLAC 文件，尝试继续处理');
                // 即使不是有效的 FLAC 文件，也尝试继续处理，因为文件可能是有效的但文件头检测失败
            }
            
            // 使用 metaflac-browser-js 库处理 FLAC 元数据
            try {
                const metaflacModule = await import('metaflac-browser-js');
                const Metaflac = metaflacModule.default || metaflacModule;
                
                console.log('[embedMusicMetadata] metaflac-browser-js 导入成功');
                
                // 从 ArrayBuffer 创建 Metaflac 实例
                const flac = Metaflac.fromArrayBuffer(arrayBuffer);
                console.log('[embedMusicMetadata] Metaflac 实例创建成功');
                
                // 读取现有标签
                console.log('[embedMusicMetadata] 现有标签:', flac.getAllTags());
                
                // 清除所有现有标签，避免重复
                flac.removeAllTags();
                console.log('[embedMusicMetadata] 已清除所有现有标签');
                
                // 清理重复的标签信息
                const cleanName = songInfo.name ? songInfo.name.split(',').map(item => item.trim()).filter((value, index, self) => self.indexOf(value) === index).join(',') : '';
                const cleanAuthor = songInfo.author ? songInfo.author.split(',').map(item => item.trim()).filter((value, index, self) => self.indexOf(value) === index).join(',') : '';
                
                // 尝试获取专辑年份
                let albumYear = new Date().getFullYear().toString();
                let fullDate = null;
                console.log('[embedMusicMetadata] 开始获取专辑年份，songInfo:', {
                    hasAudioInfo: !!songInfo.audio_info,
                    audioInfoKeys: songInfo.audio_info ? Object.keys(songInfo.audio_info) : []
                });
                
                // 打印完整的 audio_info 信息，以便了解 API 返回的具体结构
                if (songInfo.audio_info) {
                    console.log('[embedMusicMetadata] 完整的 audio_info 信息:', {
                        ...songInfo.audio_info,
                        // 隐藏可能过长的字段
                        lyric: songInfo.audio_info.lyric ? '[省略]' : undefined,
                        lyricContent: songInfo.audio_info.lyricContent ? '[省略]' : undefined
                    });
                }
                
                if (songInfo.audio_info) {
                    // 优先尝试从专辑相关字段获取年份（优先级最高）
                    const albumYearFields = [
                        'album_year', 'album_release_year', 'album_release_date',
                        'year', 'release_date', 'publish_time', 
                        'song_release_date', 'date', 'publish_year', 
                        'release_year', 'public_time', 'create_time', 'upload_time'
                    ];
                    
                    for (const field of albumYearFields) {
                        if (songInfo.audio_info[field]) {
                            console.log(`[embedMusicMetadata] 尝试从 ${field} 获取年份:`, songInfo.audio_info[field]);
                            
                            const fieldValue = songInfo.audio_info[field];
                            if (typeof fieldValue === 'number') {
                                // 如果是数字，直接转换为字符串
                                albumYear = fieldValue.toString();
                                console.log(`[embedMusicMetadata] 从 ${field} (数字) 获取年份:`, albumYear);
                                break;
                            } else if (typeof fieldValue === 'string') {
                                // 如果是字符串，检查是否包含完整日期（如 YYYY-MM-DD）
                                if (fieldValue.includes('-') && fieldValue.length >= 10) {
                                    // 如果字段值包含连字符且长度足够，直接使用完整日期
                                    fullDate = fieldValue.substring(0, 10); // 提取 YYYY-MM-DD 部分
                                    // 同时提取年份
                                    const yearMatch = fieldValue.match(/\d{4}/);
                                    if (yearMatch) {
                                        albumYear = yearMatch[0];
                                    }
                                    console.log(`[embedMusicMetadata] 从 ${field} 使用完整日期:`, fullDate);
                                    break; // 找到完整日期后停止
                                }
                            }
                        }
                    }
                } else {
                    console.log('[embedMusicMetadata] 没有 audio_info，使用当前年份:', albumYear);
                }
                
                console.log('[embedMusicMetadata] 清理后的标签信息:', {
                    cleanName,
                    cleanAuthor,
                    albumYear,
                    fullDate
                });
                
                // 设置新标签
                flac.setTag(`TITLE=${cleanName}`);
                flac.setTag(`ARTIST=${cleanAuthor}`);
                // 确保专辑名称不为空
                const albumName = songInfo.album || songInfo.audio_info?.album || songInfo.audio_info?.album_name || songInfo.audio_info?.album_name || '';
                flac.setTag(`ALBUM=${albumName || '未知专辑'}`);
                // 使用完整日期或年份（只有当值不为空时才设置）
                if (fullDate || albumYear) {
                    flac.setTag(`DATE=${fullDate || albumYear}`);
                    flac.setTag(`YEAR=${albumYear}`);
                }
                flac.setTag('GENRE=Music');
                console.log('[embedMusicMetadata] 基本标签设置完成:', {
                    title: cleanName,
                    artist: cleanAuthor,
                    album: albumName || '未知专辑',
                    date: fullDate || albumYear,
                    year: albumYear
                });
                
                // 添加歌词（如果有）
                if (lyrics) {
                    flac.setTag(`LYRICS=${lyrics}`);
                    console.log('[embedMusicMetadata] 歌词已添加到标签');
                }
                
                // 添加封面图（如果有）
                if (coverUrl) {
                    console.log('[embedMusicMetadata] 开始处理封面图:', coverUrl);
                    try {
                        const coverResponse = await fetch(coverUrl);
                        if (!coverResponse.ok) {
                            throw new Error(`封面图请求失败: ${coverResponse.status}`);
                        }
                        const coverBlob = await coverResponse.blob();
                        console.log('[embedMusicMetadata] 封面图获取成功，大小:', coverBlob.size);
                        
                        // 从 Blob 导入图片
                        await flac.importPictureFromFile(coverBlob);
                        console.log('[embedMusicMetadata] 封面图已添加到元数据');
                    } catch (coverError) {
                        console.warn('[embedMusicMetadata] 获取封面图失败:', coverError);
                    }
                } else {
                    console.log('[embedMusicMetadata] 没有封面图URL');
                }
                
                // 保存为 Blob
                const outputBlob = flac.saveAsBlob();
                console.log('[embedMusicMetadata] FLAC 元数据内嵌完成，输出大小:', outputBlob.size);
                
                return {
                    success: true,
                    blob: outputBlob,
                    originalBlob: audioBlob,
                    message: 'FLAC 元数据内嵌成功！封面图和歌词已添加到音频文件中'
                };
            } catch (flacError) {
                console.error('[embedMusicMetadata] FLAC 元数据处理失败:', flacError);
                console.error('[embedMusicMetadata] FLAC 错误堆栈:', flacError.stack);
                return {
                    success: false,
                    blob: audioBlob,
                    originalBlob: audioBlob,
                    message: 'FLAC 元数据处理失败，返回原始文件'
                };
            }
        }
        
        // 对于其他音频格式（如 MP3），使用 ID3 标签
        console.log('[embedMusicMetadata] 处理 MP3 或其他格式文件，使用 ID3 标签');
        
        const id3Module = await import('browser-id3-writer');
        let BrowserID3Writer;
        
        if (typeof id3Module.BrowserID3Writer === 'function') {
            BrowserID3Writer = id3Module.BrowserID3Writer;
        } else if (typeof id3Module.default === 'function') {
            BrowserID3Writer = id3Module.default;
        } else {
            const exports = Object.keys(id3Module);
            console.log('[embedMusicMetadata] 可用的导出:', exports);
            
            for (const key of exports) {
                if (typeof id3Module[key] === 'function' && key.toLowerCase().includes('writer')) {
                    BrowserID3Writer = id3Module[key];
                    break;
                }
            }
        }
        
        if (!BrowserID3Writer) {
            throw new Error('无法找到 BrowserID3Writer 构造函数');
        }
        
        console.log('[embedMusicMetadata] BrowserID3Writer 导入成功:', typeof BrowserID3Writer);
        
        const writer = new BrowserID3Writer(uint8Array);
        console.log('[embedMusicMetadata] ID3 Writer 实例创建成功');
        
        // 清理重复的标签信息
        const cleanName = songInfo.name ? songInfo.name.split(',').map(item => item.trim()).filter((value, index, self) => self.indexOf(value) === index).join(',') : '';
        const cleanAuthor = songInfo.author ? songInfo.author.split(',').map(item => item.trim()).filter((value, index, self) => self.indexOf(value) === index).join(',') : '';
        
        // 尝试获取专辑年份和完整日期
        let albumYear = new Date().getFullYear().toString();
        let fullDate = null;
        console.log('[embedMusicMetadata] 开始获取专辑年份，songInfo:', {
            hasAudioInfo: !!songInfo.audio_info,
            audioInfoKeys: songInfo.audio_info ? Object.keys(songInfo.audio_info) : []
        });
        
        // 打印完整的 audio_info 信息，以便了解 API 返回的具体结构
        if (songInfo.audio_info) {
            console.log('[embedMusicMetadata] 完整的 audio_info 信息:', {
                ...songInfo.audio_info,
                // 隐藏可能过长的字段
                lyric: songInfo.audio_info.lyric ? '[省略]' : undefined,
                lyricContent: songInfo.audio_info.lyricContent ? '[省略]' : undefined
            });
        }
        
        if (songInfo.audio_info) {
            // 优先尝试从专辑相关字段获取年份（优先级最高）
            const albumYearFields = [
                'album_year', 'album_release_year', 'album_release_date',
                'year', 'release_date', 'publish_time', 
                'song_release_date', 'date', 'publish_year', 
                'release_year', 'public_time', 'create_time', 'upload_time'
            ];
            
            // 检查所有可能的日期字段，优先获取完整日期
            for (const field of albumYearFields) {
                if (songInfo.audio_info[field]) {
                    console.log(`[embedMusicMetadata] 尝试从 ${field} 获取日期:`, songInfo.audio_info[field]);
                    
                    const fieldValue = songInfo.audio_info[field];
                    if (typeof fieldValue === 'string') {
                        // 直接检查字段值是否包含完整日期（如 YYYY-MM-DD）
                        if (fieldValue.includes('-') && fieldValue.length >= 10) {
                            // 如果字段值包含连字符且长度足够，直接使用完整日期
                            fullDate = fieldValue.substring(0, 10); // 提取 YYYY-MM-DD 部分
                            // 同时提取年份
                            const yearMatch = fieldValue.match(/\d{4}/);
                            if (yearMatch) {
                                albumYear = yearMatch[0];
                            }
                            console.log(`[embedMusicMetadata] 从 ${field} 使用完整日期:`, fullDate);
                            break; // 找到完整日期后停止
                        } else {
                            // 如果不是完整日期，尝试提取年份
                            const yearMatch = fieldValue.match(/\d{4}/);
                            if (yearMatch && !albumYear) { // 只在还没有年份时提取
                                albumYear = yearMatch[0];
                                console.log(`[embedMusicMetadata] 从 ${field} 提取年份:`, albumYear);
                            }
                        }
                    } else if (typeof fieldValue === 'number' && !albumYear) {
                        // 如果是数字，直接转换为字符串
                        albumYear = fieldValue.toString();
                        console.log(`[embedMusicMetadata] 从 ${field} (数字) 获取年份:`, albumYear);
                    }
                }
            }
        } else {
            console.log('[embedMusicMetadata] 没有 audio_info，使用当前年份:', albumYear);
        }
        
        console.log('[embedMusicMetadata] 清理后的标签信息:', {
            cleanName,
            cleanAuthor,
            albumYear,
            fullDate
        });
        
        writer.setFrame('TIT2', cleanName || '');
        writer.setFrame('TPE1', [cleanAuthor || '']);
        // 确保专辑名称不为空
        const albumName = songInfo.album || songInfo.audio_info?.album || songInfo.audio_info?.album_name || songInfo.audio_info?.album_name || '';
        writer.setFrame('TALB', albumName || '未知专辑');
        // 使用完整日期或年份（只有当值不为空时才设置）
        if (fullDate || albumYear) {
            writer.setFrame('TYER', fullDate || albumYear);
            writer.setFrame('TDRC', fullDate || albumYear);
        }
        writer.setFrame('TCON', ['Music']);
        console.log('[embedMusicMetadata] 基本信息设置完成:', {
            title: cleanName || '',
            artist: cleanAuthor || '',
            album: albumName || '未知专辑',
            year: albumYear,
            fullDate: fullDate,
            finalDate: fullDate || albumYear
        });
        
        if (coverUrl) {
            console.log('[embedMusicMetadata] 开始处理封面图:', coverUrl);
            try {
                const coverResponse = await fetch(coverUrl);
                if (!coverResponse.ok) {
                    throw new Error(`封面图请求失败: ${coverResponse.status}`);
                }
                const coverBlob = await coverResponse.blob();
                const coverArrayBuffer = await coverBlob.arrayBuffer();
                const coverUint8Array = new Uint8Array(coverArrayBuffer);
                console.log('[embedMusicMetadata] 封面图获取成功，大小:', coverArrayBuffer.byteLength);
                
                writer.setFrame('APIC', {
                    type: 3,
                    description: 'Cover',
                    data: coverUint8Array,
                    mime: coverBlob.type || 'image/jpeg'
                });
                console.log('[embedMusicMetadata] 封面图已添加到元数据');
            } catch (coverError) {
                console.warn('[embedMusicMetadata] 获取封面图失败:', coverError);
            }
        } else {
            console.log('[embedMusicMetadata] 没有封面图URL');
        }
        
        if (lyrics) {
            console.log('[embedMusicMetadata] 歌词长度:', lyrics.length);
            writer.setFrame('USLT', {
                description: 'Lyrics',
                lyrics: lyrics,
                language: 'chi'
            });
            console.log('[embedMusicMetadata] 歌词已添加到元数据');
        } else {
            console.log('[embedMusicMetadata] 没有歌词');
        }
        
        console.log('[embedMusicMetadata] 开始生成带元数据的音频...');
        
        if (typeof writer.addTag === 'function') {
            writer.addTag();
        } else if (typeof writer.write === 'function') {
            writer.write();
        }
        
        let taggedSongBlob;
        if (typeof writer.getBlob === 'function') {
            taggedSongBlob = writer.getBlob();
        } else if (typeof writer.getResult === 'function') {
            taggedSongBlob = writer.getResult();
        } else {
            console.warn('[embedMusicMetadata] 无法获取带元数据的音频，返回原始文件');
            return {
                success: false,
                blob: audioBlob,
                originalBlob: audioBlob,
                message: '元数据内嵌失败，返回原始音频文件'
            };
        }
        
        console.log('[embedMusicMetadata] 元数据内嵌完成，输出大小:', taggedSongBlob.size);
        
        return {
            success: true,
            blob: taggedSongBlob,
            originalBlob: audioBlob,
            message: '元数据内嵌成功！封面图和歌词已添加到音频文件中'
        };
        
    } catch (error) {
        console.error('[embedMusicMetadata] 内嵌音乐元数据失败:', error);
        console.error('[embedMusicMetadata] 错误堆栈:', error.stack);
        return {
            success: false,
            error: error.message,
            originalBlob: audioBlob
        };
    }
};

// 获取歌词数据
export const fetchLyrics = async (hash) => {
    try {
        const { get } = await import('./request');
        
        const lyricSearchResponse = await get(`/search/lyric?hash=${hash}`);
        if (lyricSearchResponse.status !== 200 || !lyricSearchResponse.candidates || lyricSearchResponse.candidates.length === 0) {
            return null;
        }
        
        const lyricResponse = await get(`/lyric?id=${lyricSearchResponse.candidates[0].id}&accesskey=${lyricSearchResponse.candidates[0].accesskey}&fmt=lrc&decode=true`);
        if (lyricResponse.status !== 200) {
            return null;
        }
        
        return lyricResponse.decodeContent || null;
    } catch (error) {
        console.error('获取歌词失败:', error);
        return null;
    }
};

// 增强版下载函数 - 包含元数据内嵌
export const downloadWithMetadata = async (downloadUrl, songInfo, options = {}) => {
    try {
        const {
            quality = '128',
            includeCover = true,
            includeLyrics = true,
            namingFormat = 'song-artist',
            onProgress = null
        } = options;
        
        if (onProgress) onProgress('正在增强歌曲信息...', 5);
        
        let enhancedSongInfo = { ...songInfo };
        console.log('[downloadWithMetadata] 原始传入的 songInfo:', songInfo);
        if (songInfo.hash) {
            try {
                console.log('[downloadWithMetadata] 调用 /audio API 获取完整信息，hash:', songInfo.hash);
                const { get } = await import('./request');
                const audioInfoResponse = await get(`/audio?hash=${songInfo.hash}`);
                if (audioInfoResponse && audioInfoResponse.data && audioInfoResponse.data.length > 0) {
                    const audioData = audioInfoResponse.data[0];
                    console.log('[downloadWithMetadata] API 返回的 audioData:', {
                        ...audioData,
                        // 隐藏可能过长的字段
                        lyric: audioData.lyric ? '[省略]' : undefined,
                        lyricContent: audioData.lyricContent ? '[省略]' : undefined
                    });
                    
                    enhancedSongInfo = {
                        name: enhancedSongInfo.name || audioData.name || audioData.song_name || enhancedSongInfo.song_name || '未知歌曲',
                        author: enhancedSongInfo.author || audioData.author || audioData.singer_name || enhancedSongInfo.singer_name || '未知歌手',
                        album: enhancedSongInfo.album || audioData.album || audioData.album_name || enhancedSongInfo.album_name || '',
                        cover: enhancedSongInfo.cover || audioData.img || audioData.cover || enhancedSongInfo.img,
                        hash: enhancedSongInfo.hash || audioData.hash,
                        audio_info: { ...audioData, ...enhancedSongInfo.audio_info }
                    };
                    console.log('[downloadWithMetadata] /audio API 返回完整信息');
                    console.log('[downloadWithMetadata] 合并后的歌曲信息:', {
                        name: enhancedSongInfo.name,
                        author: enhancedSongInfo.author,
                        album: enhancedSongInfo.album,
                        hasAudioInfo: !!enhancedSongInfo.audio_info,
                        audioInfoKeys: enhancedSongInfo.audio_info ? Object.keys(enhancedSongInfo.audio_info) : []
                    });
                }
            } catch (audioError) {
                console.warn('[downloadWithMetadata] /audio API 调用失败，继续使用原信息:', audioError.message);
            }
            
            // 新增：通过 /privilege/lite 接口获取专辑 ID
            try {
                console.log('[downloadWithMetadata] 调用 /privilege/lite API 获取专辑 ID，hash:', songInfo.hash);
                const { get } = await import('./request');
                const privilegeResponse = await get(`/privilege/lite?hash=${songInfo.hash}`);
                console.log('[downloadWithMetadata] /privilege/lite API 响应:', {
                    status: privilegeResponse.status,
                    data: privilegeResponse.data
                });
                
                if (privilegeResponse && privilegeResponse.status === 1 && privilegeResponse.data && privilegeResponse.data.length > 0) {
                    const privilegeData = privilegeResponse.data[0];
                    console.log('[downloadWithMetadata] 权限数据:', {
                        album_id: privilegeData.album_id,
                        recommend_album_id: privilegeData.recommend_album_id,
                        albumname: privilegeData.albumname,
                        singername: privilegeData.singername
                    });
                    
                    // 获取专辑 ID（优先使用 album_id，如果为 0 则使用 recommend_album_id）
                    let albumId = privilegeData.album_id && privilegeData.album_id !== '0' ? privilegeData.album_id : privilegeData.recommend_album_id;
                    
                    if (albumId && albumId !== '0') {
                        console.log('[downloadWithMetadata] 获取到专辑 ID:', albumId);
                        
                        // 更新专辑名称
                        if (privilegeData.albumname) {
                            enhancedSongInfo.album = privilegeData.albumname;
                            console.log('[downloadWithMetadata] 更新专辑名称:', enhancedSongInfo.album);
                        }
                        
                        // 通过专辑 ID 获取专辑详细信息
                        try {
                            console.log('[downloadWithMetadata] 调用 /album/detail API 获取专辑信息，albumId:', albumId);
                            const albumInfoResponse = await get(`/album/detail?id=${albumId}`);
                            console.log('[downloadWithMetadata] 专辑信息 API 响应:', {
                                status: albumInfoResponse.status,
                                data: albumInfoResponse.data
                            });
                            
                            if (albumInfoResponse && albumInfoResponse.data) {
                                const albumData = Array.isArray(albumInfoResponse.data) 
                                    ? albumInfoResponse.data[0] 
                                    : albumInfoResponse.data;
                                
                                if (albumData) {
                                    console.log('[downloadWithMetadata] 专辑数据:', {
                                        ...albumData,
                                        // 隐藏可能过长的字段
                                        songs: albumData.songs ? '[省略]' : undefined
                                    });
                                    
                                    // 从专辑信息中提取年份（优先使用 publish_date）
                                    const albumYearFields = [
                                        'publish_date', 'year', 'album_year', 'release_date', 
                                        'album_release_date', 'release_year', 'publish_year',
                                        'public_time', 'create_time', 'upload_time'
                                    ];
                                    
                                    for (const field of albumYearFields) {
                                        if (albumData[field]) {
                                            console.log(`[downloadWithMetadata] 从专辑 ${field} 字段获取年份:`, albumData[field]);
                                            // 将专辑年份添加到 audio_info 中
                                            enhancedSongInfo.audio_info = {
                                                ...enhancedSongInfo.audio_info,
                                                album_year: albumData[field]
                                            };
                                            break;
                                        }
                                    }
                                    
                                    // 更新专辑名称
                                    if (albumData.name || albumData.album_name) {
                                        enhancedSongInfo.album = albumData.name || albumData.album_name;
                                        console.log('[downloadWithMetadata] 更新专辑名称:', enhancedSongInfo.album);
                                    }
                                    
                                    // 更新封面图（使用 720 尺寸）
                                    if (albumData.sizable_cover) {
                                        const coverUrl = albumData.sizable_cover.replace('{size}', '720');
                                        enhancedSongInfo.cover = coverUrl;
                                        console.log('[downloadWithMetadata] 更新封面图:', coverUrl);
                                    }
                                }
                            }
                        } catch (albumError) {
                            console.warn('[downloadWithMetadata] /album/detail API 调用失败，继续使用原信息:', albumError.message);
                        }
                    } else {
                        console.log('[downloadWithMetadata] 未找到有效的专辑 ID');
                    }
                }
            } catch (privilegeError) {
                console.warn('[downloadWithMetadata] /privilege/lite API 调用失败，继续使用原信息:', privilegeError.message);
            }
        }
        
        if (onProgress) onProgress('正在获取音乐文件...', 10);
        
        const response = await fetch(downloadUrl);
        if (!response.ok) {
            throw new Error('网络响应错误');
        }
        
        const audioBlob = await response.blob();
        
        // 为 Blob 添加文件名，用于正确检测文件类型
        const detectedFileExtension = downloadUrl.includes('.flac') ? 'flac' : 'mp3';
        const tempFileName = `${enhancedSongInfo.author || songInfo.author || '未知歌手'} - ${enhancedSongInfo.name || songInfo.name || '未知歌曲'}.${detectedFileExtension}`;
        const tempSafeFileName = tempFileName.replace(/[<>"/\\|?*:]/g, '_');
        
        // 创建一个带有文件名的新 Blob
        const audioBlobWithName = new Blob([audioBlob], { type: audioBlob.type });
        audioBlobWithName.name = tempSafeFileName;
        console.log('[downloadWithMetadata] 创建带文件名的 Blob:', {
            fileName: audioBlobWithName.name,
            fileType: audioBlobWithName.type,
            size: audioBlobWithName.size
        });
        
        if (onProgress) onProgress('正在处理元数据...', 30);
        
        let coverUrl = null;
        if (includeCover) {
            console.log('[downloadWithMetadata] 开始获取封面图，enhancedSongInfo:', enhancedSongInfo);
            if (enhancedSongInfo.cover) {
                coverUrl = enhancedSongInfo.cover;
                console.log('[downloadWithMetadata] 从 enhancedSongInfo.cover 获取:', coverUrl);
            } else if (enhancedSongInfo.audio_info?.cover) {
                coverUrl = enhancedSongInfo.audio_info.cover;
                console.log('[downloadWithMetadata] 从 enhancedSongInfo.audio_info.cover 获取:', coverUrl);
            } else if (enhancedSongInfo.img) {
                coverUrl = enhancedSongInfo.img;
                console.log('[downloadWithMetadata] 从 enhancedSongInfo.img 获取:', coverUrl);
            } else if (enhancedSongInfo.audio_info?.img) {
                coverUrl = enhancedSongInfo.audio_info.img;
                console.log('[downloadWithMetadata] 从 enhancedSongInfo.audio_info.img 获取:', coverUrl);
            }
            console.log('[downloadWithMetadata] 最终封面图URL:', coverUrl);
        }
        
        let lyrics = null;
        if (includeLyrics && enhancedSongInfo.hash) {
            console.log('[downloadWithMetadata] 开始获取歌词，hash:', enhancedSongInfo.hash);
            lyrics = await fetchLyrics(enhancedSongInfo.hash);
            console.log('[downloadWithMetadata] 歌词获取结果:', !!lyrics);
        }
        
        if (onProgress) onProgress('正在内嵌元数据...', 60);
        
        const metadataResult = await embedMusicMetadata(audioBlobWithName, enhancedSongInfo, coverUrl, lyrics);
        
        if (onProgress) onProgress('准备下载...', 90);
        
        const finalBlob = metadataResult.success ? metadataResult.blob : audioBlobWithName;
        
        const fileExtension = downloadUrl.includes('.flac') ? 'flac' : 'mp3';
        let fileName;
        if (namingFormat === 'artist-song') {
            fileName = `${enhancedSongInfo.author || songInfo.author || '未知歌手'} - ${enhancedSongInfo.name || songInfo.name || '未知歌曲'}.${fileExtension}`;
        } else {
            // 默认使用 歌曲名 - 歌手
            fileName = `${enhancedSongInfo.name || songInfo.name || '未知歌曲'} - ${enhancedSongInfo.author || songInfo.author || '未知歌手'}.${fileExtension}`;
        }
        const safeFileName = fileName.replace(/[<>"/\\|?*:]/g, '_');
        
        if (onProgress) onProgress('完成', 100);
        
        return {
            success: true,
            blob: finalBlob,
            fileName: safeFileName,
            message: metadataResult.message || '下载完成'
        };
        
    } catch (error) {
        console.error('下载音乐失败:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

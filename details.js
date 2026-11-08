// details.js

// ========== 常量与配置 ==========
const CONFIG = {
    intervalTime: 3000,
    continentMap: {
        '北美洲': 'North America',
        '南美洲': 'South America',
        '欧洲': 'Europe',
        '非洲': 'Africa',
        '亚洲': 'Asia',
        '大洋洲': 'Oceania',
        '南极洲': 'Antarctica'
    }
};

// ========== DOM 元素缓存 ==========
const DOM = {
    bannerBox: document.querySelector('.banner-box'),
    bannerTitle: document.querySelector('.banner-title'),
    bannerList: document.querySelector('.banner-list'),
    dotGroup: document.querySelector('.dot-group'),
    btnLeft: document.querySelector('.btn-left'),
    btnRight: document.querySelector('.btn-right'),
    tipName: document.querySelector('.tip-name'),
    sectionHeaderP: document.querySelector('.section-header p'),
    listSidebar: document.getElementById('listSidebar'),
    detailPanel: {
        title: document.getElementById('detailTitle'),
        meta: document.getElementById('detailMeta'),
        banner: document.getElementById('detailBanner'),
        bannerList: document.getElementById('detailBannerList'),
        dotGroup: document.getElementById('detailDotGroup'),
        btnLeft: document.getElementById('detailBtnLeft'),
        btnRight: document.getElementById('detailBtnRight'),
        desc: document.getElementById('detailDesc'),
        infoGrid: document.getElementById('detailInfoGrid')
    }
};

// ========== 全局状态 ==========
let tourData = [];
let currentIndex = 0;
let bannerTimer = null;
let currentUser = localStorage.getItem('lastUser');
let detailsFavs = [];

// ========== 工具函数 ==========

/**
 * 获取 URL 中的大洲参数
 */
function getContinentFromURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('continent') || '北美洲';
}

/**
 * 标准化图片路径
 * @param {string|Array} coverImg - 图片路径或数组
 * @returns {Array} 图片路径数组
 */
function normalizeImages(coverImg) {
    if (!coverImg) return ['https://via.placeholder.com/800x500?text=No+Image'];
    
    let images = Array.isArray(coverImg) ? coverImg : [coverImg];
    
    return images.map(img => {
        if (typeof img === 'string' && img.startsWith('/images/')) {
            return img.substring(1); // 移除开头的 /
        }
        return img || 'https://via.placeholder.com/800x500?text=No+Image';
    });
}

/**
 * 获取第一张图片用于列表展示
 */
function getFirstImage(coverImg) {
    const imgs = normalizeImages(coverImg);
    return imgs[0];
}

// ========== 收藏功能模块 ==========

function getDetailsFavKey() {
    return `details_favs_${currentUser || 'guest'}`;
}

function loadDetailsFavs() {
    try {
        detailsFavs = JSON.parse(localStorage.getItem(getDetailsFavKey())) || [];
    } catch {
        detailsFavs = [];
    }
}

function saveDetailsFavs() {
    if (currentUser) {
        localStorage.setItem(getDetailsFavKey(), JSON.stringify(detailsFavs));
    }
}

function isFavorited(spotId) {
    return detailsFavs.some(f => f.id === ('d_' + spotId));
}

function toggleFav(item, event) {
    if (event) event.stopPropagation();

    if (!currentUser) {
        alert('请先登录后再收藏景点！\n\n请先打开 login.html 注册/登录账号。');
        return;
    }

    const favId = 'd_' + item.id;
    const existingIdx = detailsFavs.findIndex(f => f.id === favId);

    if (existingIdx >= 0) {
        detailsFavs.splice(existingIdx, 1);
    } else {
        detailsFavs.push({
            id: favId,
            name: item.name,
            img: getFirstImage(item.coverImg),
            desc: item.shortDesc || item.fullDesc,
            continent: item.continent,
            country: item.country,
            city: item.city,
            fromDetails: true
        });
    }

    saveDetailsFavs();
    updateFavButtons();
}

function updateFavButtons() {
    // 更新列表侧边栏的收藏按钮
    document.querySelectorAll('.list-sidebar .fav-btn').forEach(btn => {
        const spotId = Number(btn.dataset.spotId);
        const active = isFavorited(spotId);
        btn.classList.toggle('active', active);
        btn.querySelector('i').className = active ? 'fas fa-heart' : 'far fa-heart';
        btn.title = active ? '取消收藏' : '收藏';
    });

    // 更新详情面板内的收藏按钮
    const detailFavBtn = document.getElementById('detailFavBtn');
    if (detailFavBtn && tourData.length > 0) {
        const currentItem = tourData[currentIndex];
        if (currentItem) {
            const active = isFavorited(currentItem.id);
            detailFavBtn.classList.toggle('active', active);
            detailFavBtn.innerHTML = active
                ? '<i class="fas fa-heart"></i> 已收藏'
                : '<i class="far fa-heart"></i> 收藏';
        }
    }
}

// ========== 轮播图通用逻辑 ==========

/**
 * 初始化通用轮播图
 * @param {Object} config - 轮播配置
 */
function initCarousel(config) {
    const { 
        listEl, dotGroupEl, leftBtn, rightBtn, containerEl, 
        items, autoPlayTime = 3000, initialIndex = 0,
        onIndexChange 
    } = config;

    let currentIdx = initialIndex;
    let timer = null;
    const count = items.length;

    if (count === 0) return;

    // 渲染图片
    listEl.innerHTML = items.map((imgSrc, idx) => `
        <div class="${config.itemClass || 'banner-item'}">
            <img src="${imgSrc}" alt="Slide ${idx + 1}">
        </div>
    `).join('');

    // 渲染圆点
    dotGroupEl.innerHTML = items.map((_, idx) => `
        <div class="${config.dotClass || 'dot'} ${idx === 0 ? 'active' : ''}" data-index="${idx}"></div>
    `).join('');

    // 切换函数
    const changeIndex = (index) => {
        if (index < 0) index = count - 1;
        if (index >= count) index = 0;
        currentIdx = index;
        
        listEl.style.transform = `translateX(-${currentIdx * 100}%)`;
        
        // 更新圆点
        const dots = dotGroupEl.querySelectorAll(`.${config.dotClass || 'dot'}`);
        dots.forEach(d => d.classList.remove('active'));
        if (dots[currentIdx]) dots[currentIdx].classList.add('active');

        if (onIndexChange) onIndexChange(currentIdx);
    };

    // 自动播放
    const startAutoPlay = () => {
        clearInterval(timer);
        timer = setInterval(() => changeIndex(currentIdx + 1), autoPlayTime);
    };

    const stopAutoPlay = () => clearInterval(timer);

    // 事件绑定
    dotGroupEl.querySelectorAll(`.${config.dotClass || 'dot'}`).forEach(dot => {
        dot.addEventListener('click', function() {
            changeIndex(Number(this.dataset.index));
            stopAutoPlay();
            startAutoPlay();
        });
    });

    if (leftBtn) {
        leftBtn.addEventListener('click', () => {
            changeIndex(currentIdx - 1);
            stopAutoPlay();
            startAutoPlay();
        });
    }

    if (rightBtn) {
        rightBtn.addEventListener('click', () => {
            changeIndex(currentIdx + 1);
            stopAutoPlay();
            startAutoPlay();
        });
    }

    if (containerEl) {
        containerEl.addEventListener('mouseenter', stopAutoPlay);
        containerEl.addEventListener('mouseleave', startAutoPlay);
    }

    // 初始化
    changeIndex(initialIndex);
    startAutoPlay();

    // 返回控制接口，以便外部调用（如详情页需要重新初始化）
    return { changeIndex, startAutoPlay, stopAutoPlay };
}

function adjustSidebarHeight() {
    const sidebar = document.getElementById('listSidebar');
    const bannerBox = document.querySelector('.banner-box');
    
    if (!sidebar || !bannerBox) return;

    // 获取轮播图的高度
    const bannerHeight = bannerBox.offsetHeight;
    
}

// ========== 页面渲染逻辑 ==========

function renderPageHeader(continent) {
    DOM.bannerTitle.textContent = continent;
    DOM.sectionHeaderP.textContent = `Explore the best of ${CONFIG.continentMap[continent] || continent}`;
}

function renderSidebar() {
    if (!DOM.listSidebar) return;
    
    const html = tourData.map((item, index) => {
        const imgUrl = getFirstImage(item.coverImg);
        const favActive = isFavorited(item.id);
        return `
            <div class="list-item ${index === 0 ? 'active' : ''}" data-index="${index}" onclick="showDetail(${index})">
                <img src="${imgUrl}" alt="${item.name}" class="list-item-img">
                <div class="list-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.country} · ${item.city}</p>
                </div>
                <button class="fav-btn ${favActive ? 'active' : ''}" 
                        data-spot-id="${item.id}" 
                        onclick="toggleFav(tourData[${index}], event)" 
                        title="${favActive ? '取消收藏' : '收藏'}">
                    <i class="${favActive ? 'fas' : 'far'} fa-heart"></i>
                </button>
            </div>
        `;
    }).join('');
    
    DOM.listSidebar.innerHTML = html;
    
    // 渲染完列表后，重新计算高度
    // 使用 setTimeout 确保 DOM 渲染完成
    setTimeout(adjustSidebarHeight, 0);
}

function initTopBanner() {
    const images = tourData.map(item => getFirstImage(item.coverImg));
    
    // 使用通用轮播初始化
    initCarousel({
        listEl: DOM.bannerList,
        dotGroupEl: DOM.dotGroup,
        leftBtn: DOM.btnLeft,
        rightBtn: DOM.btnRight,
        containerEl: DOM.bannerBox,
        items: images,
        itemClass: 'banner-item',
        dotClass: 'dot',
        onIndexChange: (idx) => {
            currentIndex = idx;
            DOM.tipName.innerText = tourData[idx]?.name || '';
            // 同步更新详情面板如果当前没有选中其他项
            // 注意：这里只更新顶部轮播状态，不强制刷新详情面板内容，除非是初次加载
        }
    });
}

window.showDetail = function(index) {
    const item = tourData[index];
    if (!item) return;

    // 1. 更新侧边栏高亮
    const items = document.querySelectorAll('.list-item');
    items.forEach(el => el.classList.remove('active'));
    if (items[index]) items[index].classList.add('active');

    // 2. 更新顶部轮播位置
    // 我们需要手动触发顶部轮播的切换，但由于 initTopBanner 内部封闭了 changeIndex
    // 简单的做法是重新计算 transform，或者在 initTopBanner 中暴露方法。
    // 为了保持简洁，这里直接操作样式同步视觉，实际逻辑中最好引用 initCarousel 返回的对象
    DOM.bannerList.style.transform = `translateX(-${index * 100}%)`;
    const dots = document.querySelectorAll('.dot');
    dots.forEach(d => d.classList.remove('active'));
    if(dots[index]) dots[index].classList.add('active');
    DOM.tipName.innerText = item.name;
    currentIndex = index;

    // 3. 填充详情内容
    DOM.detailPanel.title.innerText = item.name;
    
    const favActive = isFavorited(item.id);
    DOM.detailPanel.meta.innerHTML = `
        <span>🌍 ${item.continent}</span>
        <span>🏙️ ${item.city}</span>
        <span>🔥 热度 ${item.popularity}</span>
        <button id="detailFavBtn" class="fav-btn detail-fav-btn ${favActive ? 'active' : ''}" onclick="toggleFav(tourData[${index}], event)">
            <i class="${favActive ? 'fas' : 'far'} fa-heart"></i> ${favActive ? '已收藏' : '收藏'}
        </button>
    `;

    DOM.detailPanel.desc.innerText = item.fullDesc;

    // 4. 渲染详情图片轮播
    const detailImages = normalizeImages(item.coverImg);
    DOM.detailPanel.banner.style.display = 'block';
    
    // 销毁旧轮播事件（简单处理：克隆节点替换以清除监听器，或者重新初始化）
    // 这里我们直接重新初始化 initCarousel，它会覆盖之前的 innerHTML 和事件
    initCarousel({
        listEl: DOM.detailPanel.bannerList,
        dotGroupEl: DOM.detailPanel.dotGroup,
        leftBtn: DOM.detailPanel.btnLeft,
        rightBtn: DOM.detailPanel.btnRight,
        containerEl: DOM.detailPanel.banner,
        items: detailImages,
        itemClass: 'detail-banner-item',
        dotClass: 'detail-dot',
        initialIndex: 0
    });

    // 5. 渲染额外信息网格
    DOM.detailPanel.infoGrid.style.display = 'grid';
    DOM.detailPanel.infoGrid.innerHTML = `
        <div class="info-item">
            <span class="info-label">最佳旅行时间</span>
            <span class="info-value">${item.bestTime}</span>
        </div>
        <div class="info-item">
            <span class="info-label">门票信息</span>
            <span class="info-value">${item.ticket}</span>
        </div>
        <div class="info-item">
            <span class="info-label">特色标签</span>
            <span class="info-value">${item.tag.join(' / ')}</span>
        </div>
    `;
};

// ========== 初始化入口 ==========

function initPage() {
    const continent = getContinentFromURL();
    
    // ===== 新增：读取 URL 中的 id 参数 =====
    const urlParams = new URLSearchParams(window.location.search);
    const targetId = urlParams.get('id');
    // ======================================
    
    renderPageHeader(continent);
    loadDetailsFavs();

    fetch('details.json')
        .then(res => {
            if (!res.ok) throw new Error('网络响应异常');
            return res.json();
        })
        .then(data => {
            tourData = data.filter(item => item.continent === continent);
            
            if (tourData.length === 0) {
                console.warn(`未找到${continent}的景点数据`);
                DOM.sectionHeaderP.textContent = "暂无相关景点数据";
                return;
            }
            
            // ===== 根据 id 找到对应的索引 =====
            let defaultIndex = 0;
            if (targetId) {
                const foundIndex = tourData.findIndex(item => item.id === Number(targetId));
                if (foundIndex !== -1) {
                    defaultIndex = foundIndex;
                } else {
                    console.warn(`未找到 id=${targetId} 的景点，使用第一个`);
                }
            }
            // ==================================
            
            initTopBanner();
            renderSidebar();
            showDetail(defaultIndex);
            
            window.addEventListener('resize', adjustSidebarHeight);
            adjustSidebarHeight();
        })
        .catch(err => {
            console.error("加载数据失败:", err);
            DOM.sectionHeaderP.textContent = "数据加载失败，请稍后重试";
        });
}

// 启动
initPage();
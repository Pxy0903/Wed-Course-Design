window.openDetail = function(continentOrIndex, id) {
    // 防止 event 未定义报错
    const evt = window.event;
    const button = evt?.target;
    
    // 如果直接通过 JS 调用 openDetail(index)，则没有 button
    let title = '';
    let derivedContinent = '';

    if (button) {
        const card = button.closest('.spot-card');
        const section = button.closest('section');
        
        if (card) title = card.querySelector('h3')?.textContent?.trim() || '';
        if (section) {
            const headingText = section.querySelector('h2')?.textContent?.trim() || '';
            derivedContinent = headingText.split('·')[0]?.trim() || '';
        }
    }

    // 逻辑 1: 字符串+ID (来自 HTML onclick)
    if (typeof continentOrIndex === 'string' && typeof id !== 'undefined') {
        const url = `details.html?continent=${encodeURIComponent(continentOrIndex)}&id=${id}`;
        window.location.href = url;
        return;
    }

    // 逻辑 2: 从 DOM 提取 (来自 HTML onclick 但未传参，或点击卡片其他位置)
    if (title && derivedContinent) {
        const url = `details.html?continent=${encodeURIComponent(derivedContinent)}&name=${encodeURIComponent(title)}`;
        window.location.href = url;
        return;
    }

    // 逻辑 3: 纯数字索引
    if (typeof continentOrIndex === 'number' || /^\d+$/.test(String(continentOrIndex))) {
        const idx = parseInt(continentOrIndex);
        let targetContinent = '亚洲';
        // 安全访问全局数据
        if (window.spotData && window.spotData[idx]) {
            targetContinent = window.spotData[idx].continent;
        }
        const url = `details.html?continent=${encodeURIComponent(targetContinent)}&id=${idx}`;
        window.location.href = url;
        return;
    }

    // 兜底
    const url = `details.html?continent=${encodeURIComponent(continentOrIndex || '亚洲')}&id=${id}`;
    window.location.href = url;
}


window.onload = function() {
    // 回车搜索
    const mobileSearch = document.getElementById('mobileSearch');
    if (mobileSearch) {
        mobileSearch.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                window.searchSpot();
            }
        });
    }
    // ========== 1、移动端侧边菜单 ==========
    const menuBtn = document.getElementById('menuBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    if(menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // ========== 2、首页轮播逻辑 ==========
    let currentSlide = 0;
    const slides = document.querySelectorAll('.carousel-item');
    const dots = document.querySelectorAll('.dot');
    let slideInterval;

    function renderSlide() {
        if(slides.length === 0) return;
        slides.forEach((item, idx) => {
            item.style.opacity = idx === currentSlide ? '1' : '0';
        });
        if(dots.length > 0) {
            dots.forEach((dot, idx) => {
                dot.style.backgroundColor = idx === currentSlide ? '#fff' : 'rgba(255,255,255,0.5)';
                dot.style.transform = idx === currentSlide ? 'scale(1.2)' : 'scale(1)';
            });
        }
    }

    // 在 renderSlide 之后添加，移动端触摸事件监听：左右滑动屏幕切换图片
    let touchStartX = 0;
    let touchEndX = 0;
    const carouselContainer = document.querySelector('.carousel-container');

    if (carouselContainer) {
        carouselContainer.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
        }, {passive: true});

        carouselContainer.addEventListener('touchend', e => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, {passive: true});
    }

    function handleSwipe() {
        if (touchEndX < touchStartX - 50) window.nextSlide(); // 左滑 -> 下一张
        if (touchEndX > touchStartX + 50) window.prevSlide(); // 右滑 -> 上一张
    }

    window.nextSlide = function() {
        if(slides.length === 0) return;
        currentSlide = (currentSlide + 1) % slides.length;
        renderSlide();
    }
    
    window.prevSlide = function() {
        if(slides.length === 0) return;
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        renderSlide();
    }
    
    window.switchSlide = function(index) {
        currentSlide = index;
        renderSlide();
        // 手动切换后重置定时器，避免立即自动切换
        resetInterval();
    }

    function resetInterval() {
        clearInterval(slideInterval);
        slideInterval = setInterval(window.nextSlide, 5000);
    }
    
    if(slides.length > 0) {
        resetInterval();
        renderSlide();
    }

    // ========== 3、七大洲数据源（各7个，共49个景点） ==========
    // 将数据挂载到 window 对象，方便 openDetail 等其他全局函数访问
    window.spotData = [
        // 亚洲 0-6
        {name:"万里长城",continent:"亚洲",country:"中国",tag:"bg-red-100 text-red-600",img:"https://images.unsplash.com/photo-1508804185872-d7badad00f7d",desc:"长城是中国古代军事防御工事，总长度超两万千米，世界文化遗产，中华民族标志性景观。"},
        {name:"泰姬陵",continent:"亚洲",country:"印度阿格拉",tag:"bg-amber-100 text-amber-600",img:"https://images.unsplash.com/photo-1564594736624-def7a10ab047",desc:"莫卧儿王朝纯白大理石陵墓，为纪念王后修建，世界新七大奇迹，浪漫建筑代表。"},
        {name:"富士山",continent:"亚洲",country:"日本静冈",tag:"bg-blue-100 text-blue-600",img:"https://images.unsplash.com/photo-1490806843957-31f4c9a91c65",desc:"日本最高峰活火山，对称锥形山体，樱花雪景闻名，列入世界文化遗产。"},
        {name:"吴哥窟",continent:"亚洲",country:"柬埔寨",tag:"bg-yellow-100 text-yellow-700",img:"https://images.unsplash.com/photo-1600093112561-e646aef0d645",desc:"高棉王朝巨型寺庙建筑群，世界最大宗教建筑，日出景观全球闻名。"},
        {name:"故宫紫禁城",continent:"亚洲",country:"中国北京",tag:"bg-rose-100 text-rose-600",img:"https://images.unsplash.com/photo-1584467708300-bdb05579a312",desc:"明清皇家宫殿，世界现存最大木构古建筑群，千年皇权历史载体。"},
        {name:"巴厘岛乌布梯田",continent:"亚洲",country:"印度尼西亚",tag:"bg-green-100 text-green-600",img:"https://images.unsplash.com/photo-1537996194471-e657df975ab4",desc:"巴厘岛网红水稻梯田，热带雨林搭配水系，东南亚治愈自然风光。"},
        {name:"迪拜哈利法塔",continent:"亚洲",country:"阿联酋",tag:"bg-sky-100 text-sky-600",img:"https://images.unsplash.com/photo-1512453979798-5ea266f8880c",desc:"世界第一高楼，828米超高层摩天建筑，中东现代都市地标。"},

        // 欧洲 7-13
        {name:"埃菲尔铁塔",continent:"欧洲",country:"法国巴黎",tag:"bg-sky-100 text-sky-600",img:"https://images.unsplash.com/photo-1564594736624-def7a10ab047",desc:"巴黎城市地标钢铁塔，1889年世博会建造，夜晚灯光秀浪漫出圈。"},
        {name:"罗马斗兽场",continent:"欧洲",country:"意大利罗马",tag:"bg-orange-100 text-orange-600",img:"https://images.unsplash.com/photo-1552832230-c0197dd311b5",desc:"古罗马圆形竞技场，千年历史遗迹，见证古罗马辉煌文明。"},
        {name:"大本钟伊丽莎白塔",continent:"欧洲",country:"英国伦敦",tag:"bg-indigo-100 text-indigo-600",img:"https://images.unsplash.com/photo-1567359781519-68b8edefa2f4",desc:"伦敦议会大厦钟楼，哥特式建筑，英国经典城市符号。"},
        {name:"圣托里尼蓝顶教堂",continent:"欧洲",country:"希腊",tag:"bg-cyan-100 text-cyan-600",img:"https://images.unsplash.com/photo-1613395877307-195fdb2a08c2",desc:"爱琴海白色蓝顶建筑群，日落海景，全球蜜月旅行圣地。"},
        {name:"布拉格查理大桥",continent:"欧洲",country:"捷克",tag:"bg-violet-100 text-violet-600",img:"https://images.unsplash.com/photo-1519677100203-a0e668c92439",desc:"伏尔塔瓦河古石桥，布满圣徒雕塑，中欧复古童话城市代表。"},
        {name:"瑞士阿尔卑斯少女峰",continent:"欧洲",country:"瑞士",tag:"bg-teal-100 text-teal-600",img:"https://images.unsplash.com/photo-1531366936337-7c912a4589a7",desc:"阿尔卑斯雪山高峰，冰川、湖泊、草原组合的顶级自然风光。"},
        {name:"西班牙圣家堂",continent:"欧洲",country:"巴塞罗那",tag:"bg-pink-100 text-pink-600",img:"https://images.unsplash.com/photo-1583422409516-2895a77efded",desc:"高迪设计百年未完工教堂，奇幻曲线建筑，世界文化遗产。"},

        // 非洲 14-20
        {name:"吉萨金字塔群",continent:"非洲",country:"埃及开罗",tag:"bg-yellow-100 text-yellow-700",img:"https://images.unsplash.com/photo-1503177119275-0aa32b3a9368",desc:"古埃及法老陵墓，唯一留存古代七大奇迹，搭配狮身人面像。"},
        {name:"维多利亚大瀑布",continent:"非洲",country:"赞比亚/津巴布韦",tag:"bg-emerald-100 text-emerald-600",img:"https://images.unsplash.com/photo-1541741535190-22f545330f6f",desc:"非洲巨型跨国瀑布，水雾绵延数十公里，当地称为雷霆之烟。"},
        {name:"撒哈拉沙漠",continent:"非洲",country:"北非多国",tag:"bg-orange-100 text-orange-700",img:"https://images.unsplash.com/photo-1509316785289-025f5b846b35",desc:"世界最大热带荒漠，金色沙丘、骆驼商队，极致荒漠风光。"},
        {name:"塞伦盖蒂草原",continent:"非洲",country:"坦桑尼亚",tag:"bg-lime-100 text-lime-600",img:"https://images.unsplash.com/photo-1516426122078-c23e76319801",desc:"百万动物大迁徙发源地，非洲野生动物观光第一目的地。"},
        {name:"马拉喀什红城",continent:"非洲",country:"摩洛哥",tag:"bg-red-100 text-red-700",img:"https://images.unsplash.com/photo-1489749798305-4fea3ae63d43",desc:"北非千年红墙老城，市集、清真寺充满阿拉伯异域风情。"},
        {name:"桌山",continent:"非洲",country:"南非开普敦",tag:"bg-slate-100 text-slate-600",img:"https://images.unsplash.com/photo-1580060839134-75a5edca2e99",desc:"平顶巨型山脉，俯瞰大西洋与开普敦全城，南非地标。"},
        {name:"拉利贝拉岩石教堂",continent:"非洲",country:"埃塞俄比亚",tag:"bg-amber-100 text-amber-800",img:"https://images.unsplash.com/photo-1543349689-9a4d426bee8e",desc:"整块火山岩石凿刻教堂群，非洲东正教圣地，世界文化遗产。"},

        // 北美洲 21-27
        {name:"自由女神像",continent:"北美洲",country:"美国纽约",tag:"bg-teal-100 text-teal-600",img:"https://images.unsplash.com/photo-1605130284535-11dd9eedc58a",desc:"法国赠予美国纪念独立，自由象征，纽约港标志性雕塑。"},
        {name:"尼亚加拉大瀑布",continent:"北美洲",country:"美加边境",tag:"bg-cyan-100 text-cyan-600",img:"https://images.unsplash.com/photo-1517309230475-6736d926b979",desc:"北美跨国巨型瀑布，游船近距离观赏磅礴水流。"},
        {name:"大峡谷国家公园",continent:"北美洲",country:"美国亚利桑那",tag:"bg-orange-100 text-orange-700",img:"https://images.unsplash.com/photo-1474044159687-1ee9f3a51722",desc:"科罗拉多河亿万年冲刷峡谷，层叠红岩地貌震撼世界。"},
        {name:"金门大桥",continent:"北美洲",country:"美国旧金山",tag:"bg-red-100 text-red-600",img:"https://images.unsplash.com/photo-1501594907352-04cda38ebc29",desc:"橘红色悬索大桥，旧金山城市名片，雾中观景极具氛围感。"},
        {name:"黄石国家公园",continent:"北美洲",country:"美国",tag:"bg-green-100 text-green-600",img:"https://images.unsplash.com/photo-1535632787350-4e68ef90ea41",desc:"世界首个国家公园，地热喷泉、温泉、野生动物齐聚。"},
        {name:"班夫路易斯湖",continent:"北美洲",country:"加拿大",tag:"bg-sky-100 text-sky-700",img:"https://images.unsplash.com/photo-1476611340837-e8979c58c986",desc:"落基山脉冰川湖泊，碧蓝湖水搭配雪山，北美顶级自然风光。"},
        {name:"奇琴伊察金字塔",continent:"北美洲",country:"墨西哥",tag:"bg-yellow-100 text-yellow-800",img:"https://images.unsplash.com/photo-1518638150340-f706e86654de",desc:"玛雅文明阶梯金字塔，天文建筑奇迹，世界新七大奇迹。"},

        // 南美洲 28-34
        {name:"马丘比丘",continent:"南美洲",country:"秘鲁库斯科",tag:"bg-lime-100 text-lime-600",img:"https://images.unsplash.com/photo-1587595431973-60e9270a83e4",desc:"云端印加古城，安第斯山脉悬崖遗迹，世界新七大奇迹。"},
        {name:"伊瓜苏大瀑布",continent:"南美洲",country:"阿根廷/巴西",tag:"bg-emerald-100 text-emerald-600",img:"https://images.unsplash.com/photo-1551632436-cbf8dd35adfa",desc:"世界最宽瀑布群，雨林环绕，横跨巴西阿根廷两国。"},
        {name:"里约基督雕像",continent:"南美洲",country:"巴西里约",tag:"bg-slate-100 text-slate-700",img:"https://images.unsplash.com/photo-1583483426222-3be98b1b6814",desc:"巨型基督雕塑矗立科尔科瓦多山，里约热内卢地标。"},
        {name:"乌尤尼盐沼天空之镜",continent:"南美洲",country:"玻利维亚",tag:"bg-cyan-100 text-cyan-700",img:"https://images.unsplash.com/photo-1558640476-328d47678168",desc:"世界最大盐湖，雨季水面反射天空，镜面效果独一无二。"},
        {name:"亚马逊雨林",continent:"南美洲",country:"巴西等多国",tag:"bg-green-100 text-green-700",img:"https://images.unsplash.com/photo-1531366936337-7c912a4589a7",desc:"地球之肺，全球最大热带雨林，百万种珍稀动植物栖息地。"},
        {name:"莫雷诺冰川",continent:"南美洲",country:"阿根廷",tag:"bg-sky-100 text-sky-600",img:"https://images.unsplash.com/photo-1570348424668-2b02e8224522",desc:"活冰川景观，蓝冰裂谷、冰川崩落，巴塔哥尼亚必游景点。"},
        {name:"复活节岛摩艾石像",continent:"南美洲",country:"智利",tag:"bg-stone-100 text-stone-700",img:"https://images.unsplash.com/photo-1574376676149-a0a81a0b7387",desc:"远古巨型人头石像，波利尼西亚神秘古文明遗迹。"},

        // 大洋洲 35-41
        {name:"悉尼歌剧院",continent:"大洋洲",country:"澳大利亚悉尼",tag:"bg-blue-100 text-blue-600",img:"https://images.unsplash.com/photo-1524820197278-540916411e20",desc:"贝壳造型艺术殿堂，世界文化遗产，大洋洲国家名片。"},
        {name:"大堡礁",continent:"大洋洲",country:"澳大利亚昆士兰",tag:"bg-cyan-100 text-cyan-600",img:"https://images.unsplash.com/photo-1582967788545-1a6a08dc4231",desc:"全球最大珊瑚礁群，潜水天堂，多彩海洋生物聚集地。"},
        {name:"罗托鲁瓦毛利文化村",continent:"大洋洲",country:"新西兰",tag:"bg-green-100 text-green-600",img:"https://images.unsplash.com/photo-1602435143274-4639a22f8946",desc:"毛利土著文化体验地，地热温泉、间歇泉独特火山地貌。"},
        {name:"黄金海岸沙滩",continent:"大洋洲",country:"澳大利亚",tag:"bg-amber-100 text-amber-600",img:"https://images.unsplash.com/photo-1506905925346-21bda4d32df4",desc:"绵长金色海岸线，冲浪圣地，澳洲热门度假城市。"},
        {name:"米尔福德峡湾",continent:"大洋洲",country:"新西兰南岛",tag:"bg-teal-100 text-teal-700",img:"https://images.unsplash.com/photo-1542259009477-d625272157b7",desc:"世界第八大奇迹，冰川峡湾，瀑布、雪山、深海共存。"},
        {name:"塔希提岛",continent:"大洋洲",country:"法属波利尼西亚",tag:"bg-pink-100 text-pink-600",img:"https://images.unsplash.com/photo-1544551763-77ef2d0cfc6c",desc:"南太平洋海岛天堂，水上茅草屋，蜜月旅行顶级目的地。"},
        {name:"乌鲁鲁艾尔斯岩",continent:"大洋洲",country:"澳大利亚中部",tag:"bg-orange-100 text-orange-700",img:"https://images.unsplash.com/photo-1601134467661-3b775cbb3f21",desc:"巨型红色单体砂岩，原住民圣地，日出日落色彩变幻绝美。"},

        // 南极洲 42-48
        {name:"南极点",continent:"南极洲",country:"南极大陆",tag:"bg-sky-100 text-sky-600",img:"https://images.unsplash.com/photo-1551632436-cbf8dd35adfa",desc:"地球最南端地理极点，科考地标，极地探险终极目的地。"},
        {name:"企鹅栖息地",continent:"南极洲",country:"南极半岛",tag:"bg-slate-100 text-slate-700",img:"https://images.unsplash.com/photo-1551986782-d0169b3f8fa7",desc:"阿德利、巴布亚企鹅聚居海岸，近距离观赏野生企鹅群。"},
        {name:"冰川蓝冰洞",continent:"南极洲",country:"南极大陆",tag:"bg-cyan-100 text-cyan-700",img:"https://images.unsplash.com/photo-1517783999520-f068d7431546",desc:"万年冰川融化形成蓝色冰洞，通透冰体呈现梦幻冰蓝色。"},
        {name:"欺骗岛火山",continent:"南极洲",country:"南极半岛",tag:"bg-red-100 text-red-700",img:"https://images.unsplash.com/photo-1547891654-e66ed7ebb968",desc:"活火山海湾，地热温泉，极地罕见冰火共存地貌。"},
        {name:"罗斯冰架",continent:"南极洲",country:"罗斯海",tag:"bg-blue-100 text-blue-700",img:"https://images.unsplash.com/photo-1542259009477-d625272157b7",desc:"世界最大浮动冰架，巨大冰山崩落，极地壮阔冰原景观。"},
        {name:"南极极光带",continent:"南极洲",country:"南极圈",tag:"bg-violet-100 text-violet-600",img:"https://images.unsplash.com/photo-1531366936337-7c912a4589a7",desc:"南极光绿紫色光幕横跨夜空，极地独有的天文奇观。"},
        {name:"南极科考站",continent:"南极洲",country:"多国共建",tag:"bg-slate-100 text-slate-600",img:"https://images.unsplash.com/photo-1589859849388-6e836a61c800",desc:"各国极地科研基地，人类探索南极大陆的前哨站点。"},
    ]
     const spotData = window.spotData;

    // ========== 4、搜索功能 ==========
    window.searchSpot = function(){
        const searchInput = document.getElementById('searchInput');
        const mobileSearch = document.getElementById('mobileSearch');
        
        const keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const mobileKeyword = mobileSearch ? mobileSearch.value.trim().toLowerCase() : '';
        const searchKey = keyword || mobileKeyword;
        
        if(!searchKey) {
            alert("请输入景点/国家/大洲名称搜索");
            return;
        }

        let targetIndex = -1;
        for(let i=0; i<spotData.length; i++){
            const item = spotData[i];
            // 增强搜索：匹配名称、大洲、国家
            if(item.name.toLowerCase().includes(searchKey) || 
               item.continent.toLowerCase().includes(searchKey) || 
               item.country.toLowerCase().includes(searchKey)){
                targetIndex = i;
                break;
            }
        }
        
        if(targetIndex > -1){
        const item = spotData[targetIndex];
        // 直接构造带大洲和ID的URL，复用逻辑1的路径
        const url = `details.html?continent=${encodeURIComponent(item.continent)}&id=${targetIndex}`;
        window.location.href = url;
        return;
        }
    }

    // ========== 5、登录弹窗交互 & 状态管理 ==========
    const loginModal = document.getElementById('loginModal');
    const loginBtn = document.getElementById('loginBtn');
    const loginBtnText = document.getElementById('loginBtnText'); // 新增 ID 用于修改文字
    const mobileLoginBtn = document.getElementById('mobileLoginBtn');
    const closeLogin = document.getElementById('closeLogin');
    const loginForm = document.getElementById('loginForm');
    const loginTabs = loginModal ? loginModal.querySelectorAll('.lb-tab') : [];
    const modalTitle = loginModal ? loginModal.querySelector('.lb-header-text h2') : null;
    const modalSubtitle = loginModal ? loginModal.querySelector('.lb-header-text p') : null;
    const submitButton = loginForm ? loginForm.querySelector('.lb-btn') : null;
    const loginTip = loginModal ? loginModal.querySelector('.lb-tip') : null;
    const usernameInput = document.getElementById('usernameInput');
    const passwordInput = document.getElementById('passwordInput');
    let authMode = 'login';

    function setAuthMode(mode) {
        authMode = mode === 'register' ? 'register' : 'login';

        loginTabs.forEach((tab, index) => {
            const isActive = (authMode === 'login' && index === 0) || (authMode === 'register' && index === 1);
            tab.classList.toggle('active', isActive);
        });

        if (modalTitle) modalTitle.textContent = authMode === 'login' ? '用户登录' : '用户注册';
        if (modalSubtitle) modalSubtitle.textContent = authMode === 'login' ? '输入账号即可体验登录流程' : '创建账号后自动进入个人中心';
        if (submitButton) submitButton.textContent = authMode === 'login' ? '立即登录' : '立即注册';
        if (loginTip) loginTip.textContent = authMode === 'login' ? '提示：请使用已注册账号登录' : '提示：用户名不能重复，注册成功后自动登录';
        if (usernameInput) usernameInput.placeholder = authMode === 'login' ? '请输入用户名' : '请设置用户名';
        if (passwordInput) passwordInput.placeholder = authMode === 'login' ? '请输入密码' : '请设置密码';
    }

    function openLogin(mode = 'login') {
        setAuthMode(mode);
        if (loginModal) {
            loginModal.classList.remove('hidden');
            loginModal.classList.add('flex');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeLoginModal() {
        if (loginModal) {
            loginModal.classList.add('hidden');
            loginModal.classList.remove('flex');
            document.body.style.overflow = '';
        }
    }

    function handleAuthButtonClick(e) {
        const lastUser = localStorage.getItem('lastUser');
        if(lastUser) {
            if(e) e.stopPropagation();
            window.location.href = 'favourites.html';
        } else {
            openLogin('login');
        }
    }

    loginTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            setAuthMode(index === 1 ? 'register' : 'login');
            if (loginForm) loginForm.reset();
        });
    });

    // 统一绑定打开登录框的事件
    if(loginBtn) loginBtn.addEventListener('click', handleAuthButtonClick);
    if(mobileLoginBtn) mobileLoginBtn.addEventListener('click', handleAuthButtonClick);
    if(closeLogin) closeLogin.addEventListener('click', closeLoginModal);

    if(loginModal) {
        loginModal.addEventListener('click', (e) => {
            if(e.target === loginModal) closeLoginModal();
        });
    }

    // 登录/注册表单提交
    if(loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if(!usernameInput || !passwordInput) return;

            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();
            
            if(!username || !password) {
                alert('请输入用户名和密码');
                return;
            }

            const userKey = `user_${username}`;
            const savedUserText = localStorage.getItem(userKey);

            if(authMode === 'register') {
                if(savedUserText) {
                    alert('该用户名已被注册，请更换用户名或直接登录');
                    return;
                }

                localStorage.setItem(userKey, JSON.stringify({ username, password }));
                localStorage.setItem('lastUser', username);
                closeLoginModal();
                loginForm.reset();
                updateLoginUI();
                alert('注册成功，已自动登录');
                return;
            }

            if(!savedUserText) {
                alert('该用户名尚未注册，请先注册');
                setAuthMode('register');
                return;
            }

            let savedUser;
            try {
                savedUser = JSON.parse(savedUserText);
            } catch (error) {
                alert('账号数据异常，请重新注册');
                localStorage.removeItem(userKey);
                setAuthMode('register');
                return;
            }

            if(savedUser.password !== password) {
                alert('密码错误，请重新输入');
                return;
            }

            localStorage.setItem('lastUser', username);
            closeLoginModal();
            loginForm.reset();
            updateLoginUI();
        });
    }

    // ========== 6、统一的 UI 更新函数 ==========
    function updateLoginUI() {
        const lastUser = localStorage.getItem('lastUser');
        
        if (lastUser) {
            // 已登录状态
            if(loginBtnText) loginBtnText.textContent = "我的";
            if(loginBtn) {
                loginBtn.classList.remove('bg-travel', 'hover:bg-primary');
                loginBtn.classList.add('bg-gray-700', 'hover:bg-gray-800'); // 变为深色表示已登录
                loginBtn.title = "点击进入我的收藏";
            }
            if(mobileLoginBtn) {
                mobileLoginBtn.innerHTML = `<i class="fa-solid fa-heart mr-1"></i>我的`;
                mobileLoginBtn.title = "点击进入我的收藏";
                mobileLoginBtn.onclick = () => { window.location.href = 'favourites.html'; };
            }
        } else {
            // 未登录状态
            if(loginBtnText) loginBtnText.textContent = "登录";
            if(loginBtn) {
                loginBtn.classList.add('bg-travel', 'hover:bg-primary');
                loginBtn.classList.remove('bg-gray-700', 'hover:bg-gray-800');
                loginBtn.title = "点击登录";
            }
            if(mobileLoginBtn) {
                mobileLoginBtn.innerHTML = `<i class="fa-solid fa-user mr-1"></i>登录`;
                mobileLoginBtn.title = "点击登录";
                mobileLoginBtn.onclick = openLogin;
            }
        }
    }

    function handleLogout() {
        if(confirm('确定要退出登录吗？')) {
            localStorage.removeItem('lastUser');
            updateLoginUI();
            // 如果在收藏页等需要刷新的页面，可以 location.reload()
            // 在首页通常不需要刷新，除非 UI 强依赖后端数据
        }
    }

    // 初始化时检查登录状态
    updateLoginUI();
}
# 张浩然 · 项目展示网站

纯静态网站：HTML + CSS + 少量 JS，没有构建步骤，复制整个目录到任何静态托管就能跑。

## 目录

```
index.html              首页：定位、三个项目、工作方法、修过的问题、关于、联系
projects/baobiao.html   项目 01 自动报表
projects/kefu.html      项目 02 AI 客服
projects/peijia.html    项目 03 陪驾管理系统
assets/css/site.css     设计系统与全部样式
assets/css/fonts.css    自托管字体声明（由 docs/build_fonts.py 生成）
assets/fonts/           子集化后的 woff2，只含本站用到的字，共约 470 KB
assets/js/site.js       进场动效、数字滚动、复制、灯箱、目录高亮
assets/img/             打码后的项目截图（来源与打码记录见 docs/codex-图片打码-报告.md）
docs/                   任务说明、报告、构建脚本
```

## 本地预览

```powershell
python -m http.server 8766 --bind 127.0.0.1
```

然后打开 http://127.0.0.1:8766/ 。直接双击 index.html 也能看，但字体和图片路径用的是相对路径，用服务器更准。

## 改文案

直接改 HTML。改完如果新增了以前没出现过的汉字，重新跑一次字体子集：

```powershell
python docs/build_fonts.py
```

它从本机 `C:\Windows\Fonts\NotoSerifSC-VF.ttf`、`NotoSansSC-VF.ttf` 裁字，需要 `pip install fonttools brotli`。

## 换截图

把新图放进 `assets/img/<项目>/`，保持文件名不变即可。**放上去之前确认没有真实姓名、手机号、工资金额。**

## 部署

- GitHub Pages：把整个目录推到仓库，Settings → Pages → 选 main 分支根目录。
- 阿里云服务器：复制到 `/srv/portfolio/`，Nginx 加一个 `location /portfolio/ { alias /srv/portfolio/; }`。

# 本地自动更新测试

把 Windows 新版安装包放到 `local-update-feed/releases/`，文件名保持 `OneClaw-Setup-<version>-x64.exe` 或 `arm64.exe`。

最短流程：

1. 运行 `npm run local:update-feed` 生成 `local-update-feed/releases/latest.yml`
2. 运行 `npm run local:update-serve` 启动本地更新源
3. 确认浏览器可访问 `http://127.0.0.1:8080/releases/latest.yml`
4. 安装并启动当前项目打出的旧版本测试包
5. 在应用里点“检查更新”再点“安装并重启”

说明：

- 当前 `electron-builder.yml` 已指向 `http://127.0.0.1:8080/releases/`
- `generate-local-update-feed.js` 会自动读取 `releases/` 下最新版本的安装包并生成 `latest.yml`
- 如果同时放了同版本的 `x64` 和 `arm64` 包，脚本会一起写进 `latest.yml`

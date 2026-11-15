# Talky Web 网页客户端

[官网](https://talkytalky.im/zh/?utm_source=github&utm_medium=readme&utm_campaign=talky_web) · [网页版](https://web.talkytalky.im/) · [English](README.md) · [iOS](https://github.com/mailes/talky-ios) · [Android](https://github.com/mailes/talky-android) · [桌面端](https://github.com/mailes/talky-desktop)

基于 Telegram Web K 和 gramsrv-tweb 的 Talky 浏览器客户端，使用 TypeScript、Solid.js 和 MTProto。功能可用性取决于连接的服务端。

使用 Node.js 22.22 或更新版本及 pnpm 9.15.3，克隆仓库并运行 `git submodule update --init`，执行 `pnpm install --frozen-lockfile`。将 `.env.local.example` 复制为 `.env.local`，填写自己的 API 配置及服务端地址，再执行 `pnpm start`。

构建使用 `pnpm build`，详见[构建说明](docs/BUILDING.md)。仓库不包含生产配置、旧部署构建产物、账号数据或私有 Git 历史。

所有用于客户端的 `VITE_*` 配置都可能进入浏览器构建，不能用于保存服务端密码、签名私钥或高权限令牌。忽略本地配置文件仅能防止 Git 提交，并不能隐藏客户端运行时配置。

沿用 GPL-3.0-only 许可并保留上游及第三方署名。见 LICENSE、NOTICE.md 和 docs/UPSTREAM.md。

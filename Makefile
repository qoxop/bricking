.PHONY: build debug clean install publish

.DEFAULT_GOAL := build



# 构建任务
build: install
	node common/scripts/install-run-rush.js rebuild

# 调试包
debug: build clean
	node scripts/debug.js

# 发布包
publish: build
	node common/scripts/install-run-rush.js publish --apply --target-branch main --publish

# 安装依赖
install:
	node common/scripts/install-run-rush.js update

# 清空调试目录
clean:
	@if [ -e "./_bricking" ]; then rm -rf "./_bricking"; fi

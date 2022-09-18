.PHONY: build debug clean

.DEFAULT_GOAL := build

# 构建任务
build:
	node common/scripts/install-run-rush.js rebuild

# 清空调试目录
clean:
	@if [ -e "./_bricking" ]; then rm -rf "./_bricking"; fi

# 调试包
debug: build clean
	node scripts/debug.js
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
deploy.py — dev → main 一键发布流程

用法:
    python deploy.py                  # 有改动时会让你输入提交说明
    python deploy.py "修复水质页趋势"  # 直接带提交说明

流程:
    1. 确认/切到 dev 分支
    2. 暂存并提交 dev 上的改动（若有）
    3. 推送 dev
    4. 切到 main，拉取最新
    5. 合并 dev → main（冲突则中止并提示）
    6. 推送 main
    7. 切回 dev
"""
import subprocess, sys, os

REPO = os.path.dirname(os.path.abspath(__file__))
DEV  = "dev"
MAIN = "main"

# ---------- 工具函数 ----------
def run(cmd, check=True, capture=True):
    """执行 git 命令，实时打印输出；返回 CompletedProcess。"""
    print(f"\n$ {' '.join(cmd)}")
    r = subprocess.run(cmd, cwd=REPO, capture_output=capture, text=True, encoding="utf-8")
    if r.stdout: print(r.stdout, end="")
    if r.stderr: print(r.stderr, end="")
    if check and r.returncode != 0:
        fail(f"命令失败（exit {r.returncode}）：{' '.join(cmd)}")
    return r

def fail(msg):
    print(f"\n✗ {msg}", file=sys.stderr)
    sys.exit(1)

def branch():
    r = subprocess.run(["git", "rev-parse", "--abbrev-ref", "HEAD"],
                       cwd=REPO, capture_output=True, text=True)
    return r.stdout.strip()

def dirty():
    r = subprocess.run(["git", "status", "--porcelain"], cwd=REPO, capture_output=True, text=True)
    return r.stdout.strip() != ""

# ---------- 主流程 ----------
def main():
    msg = sys.argv[1] if len(sys.argv) > 1 else None
    print("=" * 52)
    print("  dev → main 一键发布")
    print("=" * 52)

    # 0. 前置：fetch，确认远程分支存在
    run(["git", "fetch", "--all"])

    # 1. 切到 dev
    if branch() != DEV:
        if dirty():
            fail("当前分支有未提交改动，请先提交或 stash，再运行本脚本。")
        print(f"→ 当前在 {branch()}，切换到 {DEV}")
        run(["git", "checkout", DEV])

    # 2. 提交 dev 上的改动
    if dirty():
        if not msg:
            msg = input("\n请输入提交说明: ").strip()
            if not msg:
                fail("未提供提交说明，已取消。")
        run(["git", "add", "-A"])
        run(["git", "commit", "-m", msg])
    else:
        print("\n· dev 无改动，跳过提交。")

    # 3. 推送 dev
    run(["git", "push", "-u", "origin", DEV])

    # 4. 切到 main 并拉最新
    run(["git", "checkout", MAIN])
    run(["git", "pull", "--ff-only", "origin", MAIN])

    # 5. 合并 dev → main
    merge = run(["git", "merge", DEV], check=False)
    if merge.returncode != 0:
        print("\n✗ 合并出现冲突！已中止合并，请手动解决：")
        print("    1) 解决冲突文件中的标记")
        print("    2) git add <文件>")
        print("    3) git commit")
        print("    4) 重新运行 python deploy.py")
        run(["git", "merge", "--abort"], check=False)
        run(["git", "checkout", DEV], check=False)
        fail("合并中止，已切回 dev。")

    # 6. 推送 main
    run(["git", "push", "origin", MAIN])

    # 7. 切回 dev
    run(["git", "checkout", DEV])

    print("\n" + "=" * 52)
    print("  ✅ 完成！dev 已合并并发布到 main")
    print(f"  仓库：https://github.com/786916623/sea-aqua-platform")
    print("=" * 52)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n已取消。")
        sys.exit(130)

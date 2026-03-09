#!/bin/bash

# 1️⃣ 检查是否有修改
echo "🔍 检查修改状态..."
git status

# 2️⃣ 显示具体修改
echo -e "\n📝 修改内容如下："
git diff

# 3️⃣ 暂存所有修改
echo -e "\n📦 暂存所有修改..."
git add .

# 4️⃣ 提交修改
read -p "请输入本次提交信息: " msg
if [ -z "$msg" ]; then
  msg="自动部署更新"
fi
git commit -m "$msg"

# 5️⃣ 推送到 main 分支
echo -e "\n🚀 推送到 GitHub main 分支..."
git push origin main

echo -e "\n✅ 提交完成，Vercel 会自动触发部署"

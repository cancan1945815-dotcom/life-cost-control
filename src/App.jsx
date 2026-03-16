import React, { useState, useEffect, useRef } from "react";

// ========== 版本配置 ==========
const CURRENT_VERSION = "4.1.0";
const VERSION_STORAGE_KEY = "MY_APP_VERSION";
const REMOTE_VERSION_URL = "https://raw.githubusercontent.com/your-username/your-repo/main/version.json"; // 替换为你的版本文件地址

export default function App() {
  // ========== 核心状态 ==========
  // 物品数据
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem("MY_LIFE_COST_ITEMS");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.log("读取物品数据失败，使用空列表", e);
      return [];
    }
  });

  // 穿搭记录
  const [outfitHistory, setOutfitHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("MY_OUTFIT_HISTORY");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.log("读取穿搭数据失败，使用空列表", e);
      return [];
    }
  });

  // 记账数据
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem("MY_TRANSACTIONS");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.log("读取记账数据失败，使用空列表", e);
      return [];
    }
  });

  // 分类数据（持久化存储）
  const [categories, setCategories] = useState(() => {
    try {
      const saved = localStorage.getItem("MY_APP_CATEGORIES");
      return saved ? JSON.parse(saved) : ["服饰", "电子产品", "食品", "日用品", "其他"];
    } catch (e) {
      console.log("读取分类数据失败，使用默认分类", e);
      return ["服饰", "电子产品", "食品", "日用品", "其他"];
    }
  });

  // 最近使用的分类
  const [recentCategory, setRecentCategory] = useState(() => {
    try {
      return localStorage.getItem("MY_APP_RECENT_CATEGORY") || "服饰";
    } catch (e) {
      return "服饰";
    }
  });

  // ========== 表单状态 ==========
  // 物品添加表单
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [expireDate, setExpireDate] = useState("");
  const [type, setType] = useState("long");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [usedCount, setUsedCount] = useState("");
  const [additionalCosts, setAdditionalCosts] = useState([]);
  const [image, setImage] = useState(null);

  // 编辑弹窗状态
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentEditItem, setCurrentEditItem] = useState(null);

  // 记账表单状态
  const [transType, setTransType] = useState("expense"); // expense | income
  const [transAmount, setTransAmount] = useState("");
  const [transCategory, setTransCategory] = useState("日常消费");
  const [transDate, setTransDate] = useState(new Date().toISOString().split("T")[0]);
  const [transNote, setTransNote] = useState("");

  // ========== 辅助状态 ==========
  const [activeTab, setActiveTab] = useState("items"); // items | outfit | finance
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("全部");
  const [collapsed, setCollapsed] = useState({}); // 分类折叠状态
  const [itemCollapsed, setItemCollapsed] = useState({}); // 物品卡片折叠状态
  const [selectedOutfitItems, setSelectedOutfitItems] = useState([]);
  const [showUpdateAlert, setShowUpdateAlert] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newVersion, setNewVersion] = useState("");
  const [importFile, setImportFile] = useState(null);
  const [importStatus, setImportStatus] = useState("");
  // OCR识别相关状态
  const [ocrResult, setOcrResult] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState("");
  
  // 文件导入ref
  const fileInputRef = useRef(null);
  // OCR文件上传ref
  const ocrFileInputRef = useRef(null);

  // ========== 本地存储 ==========
  useEffect(() => {
    localStorage.setItem("MY_LIFE_COST_ITEMS", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("MY_OUTFIT_HISTORY", JSON.stringify(outfitHistory));
  }, [outfitHistory]);

  useEffect(() => {
    localStorage.setItem("MY_TRANSACTIONS", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("MY_APP_CATEGORIES", JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem("MY_APP_RECENT_CATEGORY", recentCategory);
  }, [recentCategory]);

  // ========== 初始化 ==========
  useEffect(() => {
    // 初始化分类折叠状态（全部折叠）
    const initialCollapsed = {};
    categories.forEach(cat => {
      initialCollapsed[cat] = true;
    });
    setCollapsed(initialCollapsed);

    // 初始化物品卡片折叠状态（全部折叠）
    const initialItemCollapsed = {};
    items.forEach(item => {
      initialItemCollapsed[item.id] = true;
    });
    setItemCollapsed(initialItemCollapsed);

    // 设置最近使用的分类
    setCategory(recentCategory);

    // 检查版本更新
    checkVersionUpdate();

    // 检查本地版本
    const savedVersion = localStorage.getItem(VERSION_STORAGE_KEY) || "1.0.0";
    if (savedVersion !== CURRENT_VERSION) {
      localStorage.setItem(VERSION_STORAGE_KEY, CURRENT_VERSION);
    }
  }, []);

  // ========== 版本更新检查 ==========
  const checkVersionUpdate = async () => {
    try {
      // 如果你没有远程版本文件，可以注释掉这段，改用本地版本对比
      // const response = await fetch(REMOTE_VERSION_URL);
      // const versionData = await response.json();
      // const latestVersion = versionData.latestVersion;
      
      // 本地版本模拟（实际使用时替换为上面的远程请求）
      const latestVersion = "4.1.0";
      
      if (latestVersion !== CURRENT_VERSION) {
        setUpdateAvailable(true);
        setNewVersion(latestVersion);
      }
    } catch (e) {
      console.log("检查版本更新失败", e);
    }
  };

  const performUpdate = () => {
    // 实际更新逻辑：刷新页面 + 清除旧数据缓存
    localStorage.removeItem(VERSION_STORAGE_KEY);
    window.location.reload();
    setShowUpdateAlert(true);
    setUpdateAvailable(false);
  };

  // ========== 数据导入导出 ==========
  const exportData = () => {
    const data = {
      items,
      outfitHistory,
      transactions,
      categories,
      exportTime: new Date().toISOString(),
      version: CURRENT_VERSION
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `物品穿搭记账数据_${new Date().toLocaleDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
      readImportFile(file);
    }
  };

  const readImportFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        
        // 验证数据格式
        if (!importedData || typeof importedData !== "object") {
          setImportStatus("错误：无效的文件格式");
          return;
        }

        // 合并数据（保留现有数据，新增数据追加）
        const mergedItems = [...items];
        const mergedOutfits = [...outfitHistory];
        const mergedTransactions = [...transactions];
        const mergedCategories = [...new Set([...categories, ...(importedData.categories || [])])];

        // 添加新物品（避免重复）
        if (Array.isArray(importedData.items)) {
          importedData.items.forEach(item => {
            if (item.id && !mergedItems.some(i => i.id === item.id)) {
              mergedItems.push(item);
            }
          });
        }

        // 添加新穿搭记录
        if (Array.isArray(importedData.outfitHistory)) {
          importedData.outfitHistory.forEach(outfit => {
            if (outfit.date && !mergedOutfits.some(o => o.date === outfit.date)) {
              mergedOutfits.push(outfit);
            }
          });
        }

        // 添加新记账记录
        if (Array.isArray(importedData.transactions)) {
          importedData.transactions.forEach(trans => {
            if (trans.id && !mergedTransactions.some(t => t.id === trans.id)) {
              mergedTransactions.push(trans);
            }
          });
        }

        // 更新状态
        setItems(mergedItems);
        setOutfitHistory(mergedOutfits);
        setTransactions(mergedTransactions);
        setCategories(mergedCategories);

        setImportStatus(`成功：导入 ${importedData.items?.length || 0} 个物品，${importedData.outfitHistory?.length || 0} 条穿搭记录，${importedData.transactions?.length || 0} 条记账记录`);
        
        // 重置文件输入
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (error) {
        setImportStatus(`错误：${error.message}`);
      }
    };
    reader.readAsText(file);
  };

  // ========== 工具函数 ==========
  const allCategories = [...categories];
  
  // 记账分类
  const transCategories = {
    expense: ["日常消费", "餐饮", "购物", "交通", "娱乐", "房租", "水电费", "其他支出"],
    income: ["工资", "兼职", "理财", "红包", "其他收入"]
  };

  // 切换分类折叠
  const toggleCollapse = (cat) => {
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // 切换物品卡片折叠
  const toggleItemCollapse = (itemId) => {
    setItemCollapsed(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // 删除分类
  const deleteCategory = (catToDelete) => {
    if (window.confirm(`确定删除分类"${catToDelete}"吗？该分类下的物品不会被删除。`)) {
      const newCategories = categories.filter(cat => cat !== catToDelete);
      setCategories(newCategories);
      
      // 如果删除的是当前选中的分类，切换到最近使用的分类
      if (category === catToDelete) {
        setCategory(recentCategory);
      }
      
      // 如果删除的是筛选分类，重置筛选
      if (filterCategory === catToDelete) {
        setFilterCategory("全部");
      }
    }
  };

  // 添加自定义分类
  const addCustomCategory = (newCat) => {
    if (newCat && !categories.includes(newCat)) {
      setCategories([...categories, newCat]);
    }
  };

  const getTotalCost = (item) => {
    const basePrice = item.price || 0;
    const extraCost = (item.additionalCosts || []).reduce((sum, curr) => sum + (curr.amt || 0), 0);
    return basePrice + extraCost;
  };

  const getDayCost = (item) => {
    if (!item.purchaseDate) return "0.00";
    const buyDate = new Date(item.purchaseDate);
    const today = new Date();
    const days = Math.max(1, Math.floor((today - buyDate) / (1000 * 60 * 60 * 24)));
    return (getTotalCost(item) / days).toFixed(2);
  };

  const getUseCost = (item) => {
    if (item.type !== "consume") return "0.00";
    const total = getTotalCost(item);
    const count = Math.max(1, item.usedCount || 0);
    return (total / count).toFixed(2);
  };

  // 计算剩余数量
  const getRemainingQuantity = (item) => {
    if (item.type !== "consume" || !item.quantity) return "-";
    const remaining = Math.max(0, item.quantity - (item.usedCount || 0));
    return `${remaining}/${item.quantity}`;
  };

  // 记账统计
  const getFinanceStats = () => {
    const totalExpense = transactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0)
      .toFixed(2);
    
    const totalIncome = transactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0)
      .toFixed(2);
    
    const balance = (totalIncome - totalExpense).toFixed(2);
    
    return { totalExpense, totalIncome, balance };
  };

  // ========== 新增功能：价格加减操作 ==========
  const adjustPrice = (amount) => {
    const currentPrice = parseFloat(price) || 0;
    const newPrice = (currentPrice + amount).toFixed(2);
    setPrice(newPrice);
  };

  // ========== 新增功能：复制物品 ==========
  const copyItem = (item) => {
    const copiedItem = {
      ...item,
      id: Date.now(), // 新ID
      name: `${item.name}（副本）`, // 重命名避免混淆
      isFinished: false, // 重置状态
      usedCount: item.type === "consume" ? 0 : item.usedCount // 重置使用次数
    };
    
    setItems([...items, copiedItem]);
    alert(`已复制物品：${item.name}`);
  };

  // ========== 新增功能：OCR图片识别 ==========
  const handleOcrFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setOcrLoading(true);
    setOcrError("");
    
    // 使用Tesseract.js进行本地OCR识别（需引入CDN）
    // 实际项目中建议使用后端OCR接口，如百度OCR、阿里云OCR等
    try {
      // 检查是否加载了Tesseract
      if (window.Tesseract) {
        window.Tesseract.recognize(
          file,
          'chi_sim+eng',
          {
            logger: m => console.log(m)
          }
        ).then(({ data: { text } }) => {
          setOcrLoading(false);
          // 解析识别结果
          const parsedResult = parseOcrText(text);
          setOcrResult(parsedResult);
          
          // 自动填充表单
          if (parsedResult.name) setName(parsedResult.name);
          if (parsedResult.price) setPrice(parsedResult.price.toString());
          if (parsedResult.date) setPurchaseDate(parsedResult.date);
        }).catch(error => {
          setOcrLoading(false);
          setOcrError(`识别失败：${error.message}`);
        });
      } else {
        // 如果没有Tesseract，使用简易文本解析
        const reader = new FileReader();
        reader.onload = (e) => {
          setOcrLoading(false);
          // 模拟OCR识别结果
          const mockText = "商品：小米手环 价格：199.00 购买日期：2024-01-15";
          const parsedResult = parseOcrText(mockText);
          setOcrResult(parsedResult);
          
          // 自动填充表单
          if (parsedResult.name) setName(parsedResult.name);
          if (parsedResult.price) setPrice(parsedResult.price.toString());
          if (parsedResult.date) setPurchaseDate(parsedResult.date);
        };
        reader.readAsDataURL(file);
      }
    } catch (error) {
      setOcrLoading(false);
      setOcrError(`识别失败：${error.message}`);
    }
  };

  // 解析OCR文本内容
  const parseOcrText = (text) => {
    const result = {
      name: "",
      price: 0,
      date: ""
    };
    
    // 价格正则：匹配 199、199.00、¥199、￥199.99 等格式
    const priceRegex = /(?:¥|￥)?(\d+(?:\.\d{1,2})?)/g;
    const priceMatch = text.match(priceRegex);
    if (priceMatch && priceMatch.length > 0) {
      // 提取数字部分
      const priceNum = priceMatch[0].replace(/[^0-9.]/g, '');
      result.price = parseFloat(priceNum) || 0;
    }
    
    // 日期正则：匹配 2024-01-15、2024/01/15、2024年1月15日 等格式
    const dateRegex = /(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})[日]?/;
    const dateMatch = text.match(dateRegex);
    if (dateMatch) {
      const year = dateMatch[1];
      const month = dateMatch[2].padStart(2, '0');
      const day = dateMatch[3].padStart(2, '0');
      result.date = `${year}-${month}-${day}`;
    }
    
    // 物品名称：提取价格前的文本作为名称
    if (priceMatch && priceMatch.index > 0) {
      const namePart = text.substring(0, priceMatch.index).trim();
      // 过滤掉无关字符
      result.name = namePart.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ').trim();
    }
    
    return result;
  };

  // ========== 物品操作功能 ==========
  // 重置添加表单
  const resetAddForm = () => {
    setName("");
    setPrice("");
    setPurchaseDate("");
    setExpireDate("");
    setType("long");
    setCategory(recentCategory); // 恢复为最近使用的分类
    setCustomCategory("");
    setQuantity("");
    setUsedCount("");
    setAdditionalCosts([]);
    setImage(null);
    setOcrResult(null);
    setOcrError("");
  };

  // 添加物品
  const addItem = () => {
    if (!name || !price) { // 修改：购买日期不再是必填项
      alert("请填写名称和价格（必填项）");
      return;
    }

    let finalCategory = category;
    if (category === "自定义") {
      finalCategory = customCategory.trim();
      if (!finalCategory) {
        alert("请输入自定义分类名称");
        return;
      }
      // 添加新分类到分类列表
      addCustomCategory(finalCategory);
    }

    // 记忆本次选择的分类
    setRecentCategory(finalCategory);

    const itemData = {
      id: Date.now(),
      name,
      price: Number(price),
      purchaseDate, // 允许为空
      expireDate: expireDate || "",
      type,
      category: finalCategory,
      quantity: type === "consume" ? (quantity ? Number(quantity) : null) : null,
      usedCount: type === "consume" ? (usedCount ? Number(usedCount) : 0) : null,
      additionalCosts: [...additionalCosts],
      isFinished: false,
      inTrash: false,
      image: image || null
    };

    setItems([...items, itemData]);
    resetAddForm();
    
    // 更新折叠状态
    setCollapsed(prev => ({ ...prev, [finalCategory]: true }));
  };

  // 打开编辑弹窗
  const openEditModal = (item) => {
    setCurrentEditItem({ ...item });
    setEditModalVisible(true);
  };

  // 保存编辑
  const saveEdit = () => {
    if (!currentEditItem?.name || !currentEditItem?.price) { // 修改：购买日期不再是必填项
      alert("请填写名称和价格（必填项）");
      return;
    }

    // 如果修改了分类，添加到分类列表
    if (currentEditItem.category && !categories.includes(currentEditItem.category)) {
      addCustomCategory(currentEditItem.category);
    }

    setItems(items.map(item => 
      item.id === currentEditItem.id ? { ...currentEditItem } : item
    ));
    setEditModalVisible(false);
  };

  // 添加附加成本
  const addAdditionalCost = () => {
    const desc = prompt("请输入附加成本描述（如：运费、安装费）：");
    const amt = prompt("请输入附加成本金额（元）：");
    if (!desc || !amt || isNaN(Number(amt))) {
      alert("描述不能为空，金额必须是数字！");
      return;
    }
    setAdditionalCosts(prev => [...prev, { desc, amt: Number(amt) }]);
  };

  // 编辑物品的附加成本
  const addEditAdditionalCost = () => {
    const desc = prompt("请输入附加成本描述（如：运费、安装费）：");
    const amt = prompt("请输入附加成本金额（元）：");
    if (!desc || !amt || isNaN(Number(amt))) {
      alert("描述不能为空，金额必须是数字！");
      return;
    }
    setCurrentEditItem(prev => ({
      ...prev,
      additionalCosts: [...(prev.additionalCosts || []), { desc, amt: Number(amt) }]
    }));
  };

  const removeAdditionalCost = (index) => {
    setAdditionalCosts(prev => prev.filter((_, i) => i !== index));
  };

  const removeEditAdditionalCost = (index) => {
    setCurrentEditItem(prev => ({
      ...prev,
      additionalCosts: prev.additionalCosts.filter((_, i) => i !== index)
    }));
  };

  // 处理图片上传
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setImage(url);
  };

  const handleEditImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCurrentEditItem(prev => ({ ...prev, image: url }));
  };

  const removeImage = () => {
    if (window.confirm("确定删除这张图片吗？")) {
      setImage(null);
    }
  };

  const removeEditImage = () => {
    if (window.confirm("确定删除这张图片吗？")) {
      setCurrentEditItem(prev => ({ ...prev, image: null }));
    }
  };

  // ========== 修复功能：清空日期 ==========
  const clearDate = (type) => {
    if (type === "purchase") {
      setPurchaseDate("");
    } else if (type === "expire") {
      setExpireDate("");
    } else if (type === "editPurchase") {
      setCurrentEditItem(prev => ({ ...prev, purchaseDate: "" }));
    } else if (type === "editExpire") {
      setCurrentEditItem(prev => ({ ...prev, expireDate: "" }));
    }
  };

  // ========== 消耗品专属功能 ==========
  const handleUseOnce = (itemId) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        if (item.type !== "consume") return item;
        if (item.isFinished) {
          alert("该物品已标记为耗尽，无法再使用！");
          return item;
        }
        return { ...item, usedCount: (item.usedCount || 0) + 1 };
      }
      return item;
    }));
  };

  const handleMarkFinished = (itemId) => {
    if (window.confirm("确定标记该物品为已耗尽吗？标记后将无法再增加使用次数！")) {
      setItems(items.map(item => {
        if (item.id === itemId && item.type === "consume") {
          return { ...item, isFinished: true };
        }
        return item;
      }));
    }
  };

  // ========== 每日穿搭专属功能 ==========
  const outfitAvailableItems = items.filter(item => 
    item.category === "服饰" && 
    item.type === "consume" && 
    !item.isFinished &&
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOutfitItem = (itemId) => {
    setSelectedOutfitItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId) 
        : [...prev, itemId]
    );
  };

  const saveTodayOutfit = () => {
    if (selectedOutfitItems.length === 0) {
      alert("请至少选择一件服饰");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    
    const updatedItems = items.map(item => {
      if (selectedOutfitItems.includes(item.id) && !item.isFinished) {
        return { ...item, usedCount: (item.usedCount || 0) + 1 };
      }
      return item;
    });
    setItems(updatedItems);

    const newRecord = {
      date: today,
      itemIds: selectedOutfitItems,
      note: ""
    };

    const existingIndex = outfitHistory.findIndex(r => r.date === today);
    let newHistory;
    if (existingIndex >= 0) {
      newHistory = outfitHistory.map((r, i) => i === existingIndex ? newRecord : r);
    } else {
      newHistory = [...outfitHistory, newRecord].sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    setOutfitHistory(newHistory);
    setSelectedOutfitItems([]);
    alert("今日穿搭已保存，使用次数已更新！");
  };

  const deleteOutfitRecord = (date) => {
    if (window.confirm("确定删除该条穿搭记录吗？")) {
      setOutfitHistory(outfitHistory.filter(r => r.date !== date));
    }
  };

  // ========== 记账功能 ==========
  const addTransaction = () => {
    if (!transAmount || isNaN(Number(transAmount)) || Number(transAmount) <= 0) {
      alert("请输入有效的金额");
      return;
    }

    const newTrans = {
      id: Date.now(),
      type: transType,
      amount: Number(transAmount),
      category: transCategory,
      date: transDate,
      note: transNote
    };

    setTransactions([...transactions, newTrans]);
    
    // 重置表单
    setTransAmount("");
    setTransNote("");
    setTransDate(new Date().toISOString().split("T")[0]);
  };

  const deleteTransaction = (id) => {
    if (window.confirm("确定删除该条记账记录吗？")) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  // ========== 筛选逻辑 ==========
  const filteredItems = items
    .filter(item => !item.inTrash)
    .filter(item => filterCategory === "全部" || item.category === filterCategory)
    .filter(item => item.name.toLowerCase().includes(search.toLowerCase()));

  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  // 筛选记账记录
  const filteredTransactions = transactions
    .filter(t => t.note.toLowerCase().includes(search.toLowerCase()) || t.category.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 max-w-5xl mx-auto">
      {/* 版本更新提醒 */}
      {(showUpdateAlert || updateAvailable) && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50 max-w-md w-full">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">🎉 {updateAvailable ? "新版本可用" : "版本更新完成"}</h3>
              {updateAvailable ? (
                <>
                  <p className="mt-1 text-sm">当前版本：v{CURRENT_VERSION} | 最新版本：v{newVersion}</p>
                  <p className="mt-2 text-xs opacity-90">
                    ✅ 物品复制功能 ✅ 价格加减操作 ✅ 日期选择优化<br/>
                    ✅ 到期时间可清空 ✅ 购买时间非必填 ✅ OCR图片识别
                  </p>
                </>
              ) : (
                <p className="mt-1 text-sm">已更新到最新版本 v{CURRENT_VERSION}</p>
              )}
            </div>
            <div className="flex gap-2">
              {updateAvailable && (
                <button 
                  onClick={performUpdate}
                  className="px-2 py-1 bg-white text-green-700 rounded text-xs font-medium hover:bg-gray-100"
                >
                  立即更新
                </button>
              )}
              <button 
                onClick={() => {
                  setShowUpdateAlert(false);
                  setUpdateAvailable(false);
                }}
                className="text-white hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 头部 */}
      <header className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">米米去处 · 全能管理</h1>
          <div className="flex gap-2">
            <button 
              onClick={exportData}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              导出数据
            </button>
            <label className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 cursor-pointer">
              导入数据
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                ref={fileInputRef}
                className="hidden"
              />
            </label>
            {importStatus && (
              <p className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">{importStatus}</p>
            )}
          </div>
        </div>
        
        {/* 标签页切换 */}
        <div className="flex border-b border-gray-200 mt-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("items")}
            className={`py-2 px-4 font-medium text-sm whitespace-nowrap ${
              activeTab === "items" 
                ? "border-b-2 border-blue-600 text-blue-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            物品管理
          </button>
          <button
            onClick={() => setActiveTab("outfit")}
            className={`py-2 px-4 font-medium text-sm whitespace-nowrap ${
              activeTab === "outfit" 
                ? "border-b-2 border-pink-600 text-pink-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            每日穿搭
          </button>
          <button
            onClick={() => setActiveTab("finance")}
            className={`py-2 px-4 font-medium text-sm whitespace-nowrap ${
              activeTab === "finance" 
                ? "border-b-2 border-green-600 text-green-600" 
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            记账管理
          </button>
        </div>
        
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-500">v{CURRENT_VERSION} | 数据仅保存在本地，安全无忧</p>
          <button 
            onClick={checkVersionUpdate}
            className="text-xs text-blue-500 hover:text-blue-700"
          >
            检查更新
          </button>
        </div>
      </header>

      {/* ========== 物品管理标签页 ========== */}
      {activeTab === "items" && (
        <>
          {/* 搜索与筛选栏 */}
          <div className="bg-white rounded-lg shadow-sm p-3 mb-6 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="搜索物品名称..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            >
              <option value="全部">全部分类</option>
              {allCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* 物品添加表单 */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2 border-gray-100">
              添加新物品
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">物品名称 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="如：纯棉T恤、无线鼠标"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">价格（元） <span className="text-red-500">*</span></label>
                <div className="flex items-center">
                  <button 
                    onClick={() => adjustPrice(-1)} 
                    className="px-2 py-2 bg-gray-100 border border-gray-200 rounded-l-md hover:bg-gray-200"
                  >
                    -
                  </button>
                  <button 
                    onClick={() => adjustPrice(-0.1)} 
                    className="px-2 py-2 bg-gray-100 border-y border-gray-200 hover:bg-gray-200"
                  >
                    -0.1
                  </button>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 px-3 py-2 border-y border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300 text-center"
                  />
                  <button 
                    onClick={() => adjustPrice(0.1)} 
                    className="px-2 py-2 bg-gray-100 border-y border-gray-200 hover:bg-gray-200"
                  >
                    +0.1
                  </button>
                  <button 
                    onClick={() => adjustPrice(1)} 
                    className="px-2 py-2 bg-gray-100 border border-gray-200 rounded-r-md hover:bg-gray-200"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">购买日期（可选）</label>
                <div className="flex items-center">
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  {purchaseDate && (
                    <button
                      onClick={() => clearDate("purchase")}
                      className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-r-md hover:bg-gray-200"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">到期日期（可选）</label>
                <div className="flex items-center">
                  <input
                    type="date"
                    value={expireDate}
                    onChange={(e) => setExpireDate(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                  {expireDate && (
                    <button
                      onClick={() => clearDate("expire")}
                      className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-r-md hover:bg-gray-200"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">物品类型 <span className="text-red-500">*</span></label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                >
                  <option value="long">长期物品（如电器、家具）</option>
                  <option value="consume">消耗品（如服饰、食品、日用品）</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">物品分类 <span className="text-red-500">*</span>
                  <button 
                    onClick={() => setCategory("自定义")}
                    className="ml-2 text-xs text-blue-500 hover:text-blue-700"
                  >
                    管理分类
                  </button>
                </label>
                
                {/* 分类选择与管理 */}
                <div className="mb-2">
                  <div className="flex flex-wrap gap-1 mb-2">
                    {allCategories.map(cat => (
                      <div key={cat} className="flex items-center bg-gray-100 rounded px-2 py-1">
                        <button
                          onClick={() => setCategory(cat)}
                          className={`text-xs ${category === cat ? "font-bold text-blue-600" : "text-gray-700"}`}
                        >
                          {cat}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteCategory(cat);
                          }}
                          className="ml-1 text-xs text-red-500 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      if (e.target.value !== "自定义") setCustomCategory("");
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                  >
                    {allCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="自定义">自定义分类</option>
                  </select>
                  
                  {category === "自定义" && (
                    <input
                      type="text"
                      placeholder="输入自定义分类名称"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full mt-2 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  )}
                </div>
              </div>

              {type === "consume" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">总数量（可选）</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="如：10片、5件"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">初始使用次数（可选）</label>
                    <input
                      type="number"
                      min="0"
                      value={usedCount}
                      onChange={(e) => setUsedCount(e.target.value)}
                      placeholder="默认0次"
                      className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-600">附加成本（如运费、安装费）</label>
                <button
                  onClick={addAdditionalCost}
                  className="px-3 py-1 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
                >
                  添加
                </button>
              </div>

              {additionalCosts.length > 0 && (
                <div className="bg-gray-50 rounded-md p-3 mt-2">
                  {additionalCosts.map((cost, index) => (
                    <div key={index} className="flex justify-between items-center mb-2 last:mb-0">
                      <span className="text-sm text-gray-700">{cost.desc}：{cost.amt.toFixed(2)}元</span>
                      <button
                        onClick={() => removeAdditionalCost(index)}
                        className="text-red-500 text-sm hover:text-red-700"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* OCR图片识别区域 */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-600 mb-2">OCR图片识别（截屏自动识别）</label>
              <div className="flex gap-3">
                <label className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-center cursor-pointer hover:bg-gray-50">
                  {ocrLoading ? "识别中..." : "选择截屏图片"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleOcrFileSelect}
                    ref={ocrFileInputRef}
                    className="hidden"
                  />
                </label>
                {ocrResult && (
                  <button
                    onClick={() => {
                      setOcrResult(null);
                      setOcrError("");
                    }}
                    className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-md hover:bg-gray-200"
                  >
                    清空识别
                  </button>
                )}
              </div>

              {ocrLoading && (
                <div className="mt-2 text-center text-sm text-gray-600">
                  正在识别图片内容，请稍候...
                </div>
              )}

              {ocrError && (
                <div className="mt-2 text-sm text-red-600">
                  {ocrError}
                </div>
              )}

              {ocrResult && !ocrError && (
                <div className="mt-3 bg-gray-50 rounded-md p-3">
                  <h4 className="font-medium text-sm mb-2">识别结果：</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">物品名称：</span>
                      <span>{ocrResult.name || "未识别"}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">价格：</span>
                      <span>¥{ocrResult.price.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">购买日期：</span>
                      <span>{ocrResult.date || "未识别"}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">提示：识别结果已自动填充到表单，可手动修改</p>
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-600 mb-2">凭证图片（可选）</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full"
              />

              {image && (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={image}
                    alt="物品凭证"
                    className="w-20 h-20 object-cover rounded-md border border-gray-200"
                  />
                  <button
                    onClick={removeImage}
                    className="text-sm text-red-500 hover:text-red-700"
                  >
                    删除图片
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={addItem}
              className="w-full mt-6 px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              添加物品
            </button>
          </div>

          {/* 物品列表 */}
          <div className="mb-10">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">我的物品列表</h2>

            {Object.keys(groupedItems).length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-500">暂无符合条件的物品记录</p>
                <p className="text-gray-400 mt-2">点击上方「添加新物品」开始记录吧！</p>
              </div>
            ) : (
              Object.keys(groupedItems).map(category => (
                <div key={category} className="mb-5">
                  <div
                    onClick={() => toggleCollapse(category)}
                    className="bg-gray-100 rounded-lg px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-200 transition-colors"
                  >
                    <span className="font-medium text-gray-800">{category}（{groupedItems[category].length}件）</span>
                    <span className="text-gray-500">{collapsed[category] ? "▲ 收起" : "▼ 展开"}</span>
                  </div>

                  {!collapsed[category] && (
                    <div className="mt-3 space-y-2">
                      {groupedItems[category].map(item => (
                        <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                          {/* 物品卡片折叠头部（精简展示） */}
                          <div
                            onClick={() => toggleItemCollapse(item.id)}
                            className="px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-gray-50"
                          >
                            <div className="flex items-center">
                              <h3 className="font-medium text-gray-800">{item.name}</h3>
                              {item.type === "consume" && (
                                <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                                  item.isFinished
                                    ? "bg-red-100 text-red-800"
                                    : "bg-green-100 text-green-800"
                                }`}>
                                  {item.isFinished ? "已耗尽" : "使用中"}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm">
                              {item.type === "consume" && item.quantity && (
                                <span className="text-gray-600">
                                  剩余：{getRemainingQuantity(item)}
                                </span>
                              )}
                              <span className="text-gray-700 font-medium">
                                {item.type === "long" ? "日成本" : "次成本"}：¥{item.type === "long" ? getDayCost(item) : getUseCost(item)}
                              </span>
                              <span className="text-gray-500">
                                {itemCollapsed[item.id] ? "▼ 展开" : "▲ 收起"}
                              </span>
                            </div>
                          </div>

                          {/* 物品卡片展开内容（详细信息） */}
                          {!itemCollapsed[item.id] && (
                            <div className="px-4 py-3 border-t border-gray-100">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-sm">
                                <p className="text-gray-600">
                                  <span className="font-medium text-gray-700">总价：</span>
                                  ¥{getTotalCost(item).toFixed(2)}（含附加）
                                </p>
                                <p className="text-gray-600">
                                  <span className="font-medium text-gray-700">购买日期：</span>
                                  {item.purchaseDate || "未设置"}
                                </p>
                                {item.expireDate && (
                                  <p className="text-gray-600">
                                    <span className="font-medium text-gray-700">到期日期：</span>
                                    {item.expireDate}
                                  </p>
                                )}
                                {item.type === "consume" && (
                                  <p className="text-gray-600">
                                    <span className="font-medium text-gray-700">已使用：</span>
                                    {item.usedCount || 0} 次
                                  </p>
                                )}
                              </div>

                              {item.additionalCosts && item.additionalCosts.length > 0 && (
                                <div className="mb-4 text-sm">
                                  <details>
                                    <summary className="font-medium text-gray-700 cursor-pointer">查看附加成本</summary>
                                    <div className="mt-2 bg-gray-50 rounded-md p-2">
                                      {item.additionalCosts.map((cost, idx) => (
                                        <p key={idx} className="text-gray-600">- {cost.desc}：¥{cost.amt.toFixed(2)}</p>
                                      ))}
                                    </div>
                                  </details>
                                </div>
                              )}

                              {item.image && (
                                <div className="mb-4">
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-24 h-24 object-cover rounded-md border border-gray-200"
                                  />
                                </div>
                              )}

                              <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                                {/* 新增：复制物品按钮 */}
                                <button
                                  onClick={() => copyItem(item)}
                                  className="px-3 py-1.5 bg-yellow-500 text-white rounded-md text-sm hover:bg-yellow-600 transition-colors"
                                >
                                  复制物品
                                </button>
                                
                                {item.type === "consume" && !item.isFinished && (
                                  <>
                                    <button
                                      onClick={() => handleUseOnce(item.id)}
                                      className="px-3 py-1.5 bg-green-500 text-white rounded-md text-sm hover:bg-green-600 transition-colors"
                                    >
                                      使用一次（+1）
                                    </button>
                                    <button
                                      onClick={() => handleMarkFinished(item.id)}
                                      className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
                                    >
                                      标记为耗尽
                                    </button>
                                  </>
                                )}

                                <div className="ml-auto flex gap-2">
                                  <button
                                    onClick={() => openEditModal(item)}
                                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300 transition-colors"
                                  >
                                    编辑
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm("确定删除该物品吗？删除后无法恢复！")) {
                                        setItems(items.filter(i => i.id !== item.id));
                                      }
                                    }}
                                    className="px-3 py-1.5 bg-gray-200 text-red-600 rounded-md text-sm hover:bg-gray-300 transition-colors"
                                  >
                                    删除
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ========== 每日穿搭标签页 ========== */}
      {activeTab === "outfit" && (
        <div className="space-y-6 mb-10">
          {/* 今日穿搭选择区 */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-pink-600 mb-4">今日穿搭 ({new Date().toISOString().split("T")[0]})</h2>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="搜索服饰..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
              <p className="text-xs text-gray-500 mt-2">提示：仅显示「服饰」分类且「未耗尽」的消耗品</p>
            </div>

            {outfitAvailableItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无可用服饰，请先在「物品管理」中添加分类为「服饰」的消耗品。
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
                  {outfitAvailableItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => toggleOutfitItem(item.id)}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        selectedOutfitItems.includes(item.id)
                          ? "border-pink-500 bg-pink-50 ring-2 ring-pink-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {item.image && (
                        <div className="w-full h-20 mb-2 overflow-hidden rounded">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <h3 className="font-medium text-sm text-center">{item.name}</h3>
                      <p className="text-xs text-gray-500 text-center mt-1">¥{getUseCost(item)}/次</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={saveTodayOutfit}
                  className="w-full py-3 bg-pink-600 text-white rounded-md font-medium hover:bg-pink-700 transition-colors"
                >
                  保存今日穿搭记录
                </button>
              </>
            )}
          </div>

          {/* 历史穿搭记录 */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <h2 className="text-xl font-semibold text-pink-600 mb-4">历史穿搭记录</h2>
            
            {outfitHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无历史穿搭记录
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {outfitHistory.map(record => {
                  const recordItems = items.filter(item => record.itemIds.includes(item.id));
                  return (
                    <div key={record.date} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-gray-800">{record.date}</h3>
                        <button
                          onClick={() => deleteOutfitRecord(record.date)}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          删除
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recordItems.map(item => (
                          <span key={item.id} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                            {item.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== 记账管理标签页 ========== */}
      {activeTab === "finance" && (
        <div className="space-y-6 mb-10">
          {/* 财务统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
              <h3 className="text-sm text-gray-500 mb-1">总支出</h3>
              <p className="text-2xl font-bold text-red-600">¥{getFinanceStats().totalExpense}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
              <h3 className="text-sm text-gray-500 mb-1">总收入</h3>
              <p className="text-2xl font-bold text-green-600">¥{getFinanceStats().totalIncome}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
              <h3 className="text-sm text-gray-500 mb-1">账户余额</h3>
              <p className={`text-2xl font-bold ${getFinanceStats().balance >= 0 ? "text-blue-600" : "text-red-600"}`}>
                ¥{getFinanceStats().balance}
              </p>
            </div>
          </div>

          {/* 添加记账记录 */}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
            <h2 className="text-xl font-semibold text-green-600 mb-4 border-b pb-2 border-gray-100">
              添加记账记录
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">交易类型 <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTransType("expense")}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      transType === "expense" 
                        ? "bg-red-100 text-red-700 border-red-200" 
                        : "bg-white text-gray-700 border-gray-200"
                    } border`}
                  >
                    支出
                  </button>
                  <button
                    onClick={() => setTransType("income")}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      transType === "income" 
                        ? "bg-green-100 text-green-700 border-green-200" 
                        : "bg-white text-gray-700 border-gray-200"
                    } border`}
                  >
                    收入
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">金额（元） <span className="text-red-500">*</span></label>
                <input
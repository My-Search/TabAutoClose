# TabAutoClose
TabAutoClose是Chrome插件，根据`用户规则` + `页面指标智能防误关` 清理标签，标签清理后可查看清理记录，插件icon右下角也会显示当前session清理的标签数。

**安装：**
[chrome应用商店](https://chrome.google.com/webstore/detail/tabautoclose/gkcmhaemnhadicgpdfhokobadnknaaka?hl=zh-CN&authuser=0)

文件方式：将代码下载下来，执行`npm run build`进行构建，开启开发者模式，将构建好的`dist`文件夹拖进去即可。

**功能：**

1、通过添加规则，会自动清理标签
2、通过配置安全范围，可保护活跃标签前面的tab
比如你要百度东西，然后选择了一条去查看，但看了不好，你可能想要再去搜索页中看其它搜索结果，设置“安全范围”可以防止前面的标签被清理。 
3、标签清理后可查看清理记录，插件icon右下角也会显示当前session清理的标签数。

> 插件如何防规则误关：根据向页面中注入指标收集脚本，在适合的时机触发收集（是否关闭时提示、聚集输入框次数、滚动页数）向插件进程bg发送指标参数，作为插件判断时的`与条件`。

**效果：**
![PixPin_2025-01-28_22-28-40](https://github.com/user-attachments/assets/1f31ccf1-0e8d-4584-b26a-00d331d219e3)
![PixPin_2025-01-28_22-24-48](https://github.com/user-attachments/assets/ed0cabfb-ec5e-4bee-9f28-214a5270cb47)



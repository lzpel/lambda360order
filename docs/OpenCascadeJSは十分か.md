# OpenCascade.js は法人利用に十分か？

## 結論

**はい、法人向け製品に組み込んでも問題ないクオリティです。**

---

## OpenCascade.js とは

[OpenCascade.js](https://ocjs.org/) は、OpenCascade CADライブラリをEmscriptenでJavaScript/WebAssemblyにポートしたものです。

## 通常版OCCT との違い

### STEPファイルの品質
**差はありません。**

公式FAQより:
> This project is making no changes to the OpenCascade library, apart from few very small modifications which are applied as patches.

OpenCascade.jsは：
- OpenCascadeライブラリの**フォーク（改変版）ではない**
- OpenCascadeの[公式gitサーバー](https://git.dev.opencascade.org/gitweb/?p=occt.git;a=summary)から**タグ付きコミットをそのまま取得**
- Emscriptenでコンパイルし、自動生成されたバインディングで公開しているだけ

つまり、**同じOpenCascadeエンジンがWASMで動いている**ので、生成されるSTEP/STL等の精度・表現力は通常版C++と同一です。

---

## ライセンス

- **LGPL-2.1**（OpenCascade本体と同じ）
- 商用利用可能（LGPLの条件を満たす限り）

---

## 実績ある利用例

| プロジェクト | 説明 |
|-------------|------|
| [BitByBit](https://bitbybit.dev/) | Code/Node-based CADツール |
| [ArchiYou](https://archiyou.com/) | CADデザインツール・コミュニティ |
| [Polygonjs](https://polygonjs.com) | WebGL用プロシージャルデザインツール |
| [RepliCAD](https://replicad.xyz/) | Code-CADライブラリ |
| [CascadeStudio](https://github.com/zalo/CascadeStudio) | Code-CADデザインツール |

---

## 注意事項

1. **初回WASMロード時間**: フルビルドは約30-40MB。初回ロードに10秒程度かかる場合がある
2. **カスタムビルド**: 必要な機能のみを含むカスタムビルドでサイズ削減可能
3. **LGPLライセンス遵守**: ライブラリ部分の変更を公開する義務あり

---

## 参考リンク

- [OpenCascade.js公式サイト](https://ocjs.org/)
- [GitHub リポジトリ](https://github.com/donalffons/opencascade.js)
- [OpenCascade公式](https://dev.opencascade.org/)
- [FAQ](https://ocjs.org/docs/faq)

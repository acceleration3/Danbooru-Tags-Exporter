// ==UserScript==
// @name         Gelbooru Tags Select to Export
// @name:zh-TW   Gelbooru 標籤導出器
// @name:zh-HK   Gelbooru 標籤導出器
// @name:zh-CN   Gelbooru 标签导出器
// @name:ja      Gelbooru Tags Select to Export
// @namespace    https://github.com/acceleration3/Danbooru-Tags-Exporter
// @supportURL   https://github.com/acceleration3/Danbooru-Tags-Exporter/issues
// @homepageURL  https://github.com/acceleration3/Danbooru-Tags-Exporter
// @version      0.3.2
// @description  Select specified tags and copy to clipboard, for Stable Diffusion WebUI or NovelAI to use.
// @description:zh-TW  選擇指定標籤並複製到剪貼板，供Stable Diffusion WebUI或NovelAI等使用
// @description:zh-HK  選擇指定標籤並複製到剪貼板，供Stable Diffusion WebUI或NovelAI等使用
// @description:zh-CN  选择指定标签并复制到剪贴板，供Stable Diffusion WebUI或NovelAI等使用
// @description:ja  指定したタグを選択し、クリップボードにコピーして、Stable Diffusion WebUIやNovelAIなどで使用することができます。
// @author       acceleration3
// @match        https://gelbooru.com/index.php?page=post&s=view&id=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=gelbooru.com
// @grant        GM_setClipboard
// @grant        GM_notification
// @grant        GM_addStyle
// @license      AGPL-3.0
// ==/UserScript==

(function () {
    'use strict';
    if (!GM_addStyle) {
        var GM_addStyle = function (aCss) {
            'use strict';
            let head = document.getElementsByTagName('head')[0];
            if (head) {
                let style = document.createElement('style');
                style.setAttribute('type', 'text/css');
                style.textContent = aCss;
                head.appendChild(style);
                return style;
            }
            return null;
        };
    }
    GM_addStyle(`#tags-exporter-setting button, #tag-list button {padding: 0.25em 0.75em;}
                #tags-exporter-setting label{margin: .25em; line-height: 1.5em;}
               .tag-weight {width: 3em; margin-left: .25em}`);

    let SettingPanel = document.createElement('section');
    SettingPanel.id = "tags-exporter-setting";
    SettingPanel.innerHTML = `
      <h2>Tags Export Settings</h2>
<input type="checkbox" id="bracket-escape" checked/><label for="bracket-escape"><code>(</code> <code>)</code> -> <code>\\(</code> <code>\\)</code></label><br>
<input type="checkbox" id="set-weight" /><label for="set-weight">Setting weights</label><br>
<div>
 <input type="radio" name="use-bracket" id="round-brackets" value="0" checked/><label for="round-brackets">Using ( )</label>
<input type="radio" name="use-bracket" id="curly-brackets" value="-1"/><label for="curly-brackets">Using { }</label></div>
    `
    let Container = document.createElement('div');
    Container.id = "tags-exporter-container";
    Container.innerHTML = `<button name="select_all">All</button>
<button  name="select_none">None</button>
<button  name="invert_select">Invert</button>
<button  name="export">Export</button>
`

    function insertAfter(newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }

    function insertBefore(newNode, referenceNode) {
        referenceNode.parentNode.insertBefore(newNode, referenceNode);
    }

    insertBefore(SettingPanel, document.querySelector("#tag-list"))
    insertAfter(Container, document.querySelector("#tags-exporter-setting"))

    function addBrackets(prompts, isRound, n) {
        let l, r;
        if (n == 0)
            return prompts
        else if (n > 0) {
            if (isRound) {
                l = '('
                r = ')'
            }
            else {
                l = '{'
                r = '}'
            }
        } else {
            l = '['
            r = ']'
        }
        n = Math.abs(n)
        return l.repeat(n).concat(prompts, r.repeat(n))
    }
    function exportTags(target) {
        let tags = []
        let bracket_escape = document.getElementById("bracket-escape").checked
        let set_weight = document.getElementById("set-weight").checked
        let round_brackets = document.getElementById("round-brackets").checked
        document.querySelectorAll(target).forEach((e) => {
            let prompts = e.value
            if (bracket_escape)
                prompts = prompts.replaceAll(`(`, `\\(`).replaceAll(`)`, `\\)`)
            if (set_weight) {
                prompts = addBrackets(prompts, round_brackets, e.nextSibling.value)
            }
            tags.push(prompts)
        })
        let res = tags.join(", ")
        GM_setClipboard(res)
        GM_notification(`${tags.length} tag(s) were copied.`, "Gelbooru Tags Exporter")
    }

    function insertButtons(target) {
        let head = document.querySelector(`li.tag-type-${target}`)
        if (!head) return;
        let buttonContainer = Container.cloneNode(true)
        buttonContainer.id = `${target}-buttons`
        insertBefore(buttonContainer, head)
        document.querySelectorAll(`li.tag-type-${target}>a`).forEach((e) => {
            let chk = document.createElement('input');
            chk.type = "checkbox"
            chk.name = `${target}s`
            chk.value = e.innerText
            insertAfter(chk, e.previousSibling)

            let nbr = document.createElement('input');
            nbr.type = "number"
            nbr.name = `${target}s-weight`
            nbr.className = "tag-weight"
            nbr.value = 0
            nbr.hidden = true
            insertAfter(nbr, chk)
        })

        buttonContainer.querySelector("[name='select_all']").onclick = function () {
            var items = document.getElementsByName(`${target}s`);
            for (var i = 0; i < items.length; i++) {
                items[i].checked = true;

            }
        };
        buttonContainer.querySelector("[name='select_none']").onclick = function () {
            var items = document.getElementsByName(`${target}s`);
            for (var i = 0; i < items.length; i++) {
                items[i].checked = false;

            }
        };
        buttonContainer.querySelector("[name='invert_select']").onclick = function () {
            var items = document.getElementsByName(`${target}s`);
            for (var i = 0; i < items.length; i++) {
                items[i].checked == true ? items[i].checked = false : items[i].checked = true;

            }
        };
        buttonContainer.querySelector("[name='export']").onclick = function () {
            exportTags(`[name=${target}s]:checked`)
        };
    }

    ["artist", "metadata", "character", "copyright", "general"].forEach((t) => insertButtons(t))

    Container.querySelector("[name='select_all']").onclick = function () {
        var items = document.querySelectorAll("#tag-list input[type='checkbox']")
        for (var i = 0; i < items.length; i++) {
            items[i].checked = true;
        }
    };
    Container.querySelector("[name='select_none']").onclick = function () {
        var items = document.querySelectorAll("#tag-list input[type='checkbox']")
        for (var i = 0; i < items.length; i++) {
            items[i].checked = false;
        }
    };
    Container.querySelector("[name='invert_select']").onclick = function () {
        var items = document.querySelectorAll("#tag-list input[type='checkbox']")
        for (var i = 0; i < items.length; i++) {
            items[i].checked == true ? items[i].checked = false : items[i].checked = true;
        }
    };
    Container.querySelector("[name='export']").onclick = function () {
        exportTags(`#tag-list input[type='checkbox']:checked`)
    };

    document.getElementById("set-weight").onchange = function (e) {
        if (e.target.checked) {
            document.querySelectorAll("#tag-list input[type='number']").forEach((e) => e.hidden = false)
        } else {
            document.querySelectorAll("#tag-list input[type='number']").forEach((e) => e.hidden = true)
        }
    }

})();

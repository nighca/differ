!function(window){
	var compare = diff.compare;

    var render = function(template, vars){
        return template.replace(/\$\{([^\{\}]*)\}/g, function(_, name){
            return vars[name.trim()] || '';
        });
    };

    var encodeHTML = function(str){
        return str.replace(/&/g, "&gt;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/ /g, "&nbsp;")
            .replace(/\'/g, "'")
            .replace(/\"/g, "&quot;")
            .replace(/\n/g, "<br>");
    };

    // simple split
    var simpleSplit = function(cnt){
        return cnt.split('');
    };

    // participle code / word
    var participle = function(cnt){
        var arr = [];
        for(var i = 1, l = cnt.length, pos = 0; i < l; i++){
            var isPlainPattern = /[\w\_\$]+/,
                isPrevPlain = isPlainPattern.test(cnt[i-1]),
                isPlain = isPlainPattern.test(cnt[i]);

            if(
                !(isPrevPlain && isPlain)
            ){
                arr.push(cnt.slice(pos, i));
                pos = i;
            }

            if(i === l-1){
                arr.push(cnt.slice(pos));
            }
        }
        return arr;
    };

    var marks = {
        normal: {
            title: '',
            mark: ''
        },
        remove: {
            title: 'removed',
            mark: '-'
        },
        insert: {
            title: 'inserted',
            mark: '+'
        }
    };

    var templates = {
        table: '<table class="diff-block"><tbody>${cnt}</tbody></table>',
        line: '<tr id="line-${num}" class="line ${type}">${parts}<td>${code}</td></tr>',
        lineNumber: '<td class="line-num">${num}</td>',
        mark: '<td title="${title}" class="mark">${mark}</td>',
        code: '<span class="code ${type}">${cnt}</span>'
    };

    var getLine = function(line, i){
        return render(templates.line, {
            num: i + 1,
            type: line.type,

            parts: [
                [templates.lineNumber, {num: line.pos1}],
                [templates.lineNumber, {num: line.pos2}],
                [templates.mark, marks[line.type]]
            ].map(function(arr){
                return render(arr[0], arr[1]);
            }).join(''),

            code: line.cnt.map(function(code){
                return render(templates.code, {
                    type: code.type,
                    cnt: encodeHTML(code.cnt)
                });
            }).join('')
        });
    };

    var getTable = function(lines){
        return render(templates.table, {
            cnt: lines.map(getLine).join('')
        });
    };

    // split method ( simple / participle )
    var split = participle;

    var formattedDiffBlock = {
        init: function(wrapper, cnt1, cnt2){
            this.wrapper = wrapper;
            this.setContent(cnt1, cnt2);
        },
        getLinesDiff: function(){
            var lines1 = this.cnt1.split('\n'),
                lines2 = this.cnt2.split('\n'),
                lines = [];

            var curr = {
                pos1: 0,
                pos2: 0,
                prevEnd: 0
            };

            // deal with diffs
            compare(this.cnt1, this.cnt2, '\n').diff.forEach(function(diff, i){
                var start = diff[0],
                    len = diff[1],
                    to = diff[2];

                lines1.slice(curr.prevEnd, start).forEach(function(cnt){
                    lines.push({
                        type: 'normal',
                        cnt: cnt,
                        pos1: ++curr.pos1,
                        pos2: ++curr.pos2
                    });
                });

                lines1.slice(start, start + len).forEach(function(cnt){
                    lines.push({
                        type: 'remove',
                        cnt: cnt,
                        pos1: ++curr.pos1,
                        pos2: ''
                    });
                });

                to && to.split('\n').forEach(function(cnt){
                    lines.push({
                        type: 'insert',
                        cnt: cnt,
                        pos1: '',
                        pos2: ++curr.pos2
                    });
                });

                curr.prevEnd = start + len;
            });

            // same content after the last diff
            lines1.slice(curr.prevEnd).forEach(function(cnt){
                lines.push({
                    type: 'normal',
                    cnt: cnt,
                    pos1: ++curr.pos1,
                    pos2: ++curr.pos2
                });
            });

            this.lines = lines;
        },
        getInlineDiff: function(){
            var lines = this.lines;

            lines.forEach(function(line, i){
                var prev = lines[i-1],
                    curr = lines[i],
                    next = lines[i+1],
                    nnext = lines[i+2];

                if(
                    (!prev || prev.type !== 'remove') &&
                    (curr.type === 'remove') &&
                    (next && next.type === 'insert') &&
                    (!nnext || nnext.type !== 'insert')
                ){
                    var prevEnd = 0,
                        origin = split(curr.cnt),
                        target = split(next.cnt),
                        originArr = [],
                        targetArr = [];

                    compare(curr.cnt, next.cnt, split).diff.forEach(function(diff, i){
                        var start = diff[0],
                            len = diff[1],
                            to = diff[2];

                        var kept = origin.slice(prevEnd, start).join('');
                        if(kept){
                            kept = {
                                type: 'normal',
                                cnt: kept
                            };
                            originArr.push(kept);
                            targetArr.push(kept);
                        }
                        
                        var removed = origin.slice(start, start + len).join('');
                        if(removed){
                            removed = {
                                type: 'remove',
                                cnt: removed
                            };
                            originArr.push(removed);
                        }

                        var inserted = to;
                        if(inserted){
                            inserted = {
                                type: 'insert',
                                cnt: inserted
                            };

                            targetArr.push(inserted);
                        }

                        prevEnd = start + len;
                    });

                    var leftKept = origin.slice(prevEnd).join('');
                    if(leftKept){
                        leftKept = {
                            type: 'normal',
                            cnt: leftKept
                        };

                        originArr.push(leftKept);
                        targetArr.push(leftKept);
                    }

                    curr.cnt = originArr;
                    next.cnt = targetArr;
                }else if(typeof line.cnt === 'string'){
                    line.cnt = [{
                        type: 'normal',
                        cnt: line.cnt
                    }];
                }
            });

            this.lines = lines;
        },
        getDiff: function(){
            this.getLinesDiff();
            this.getInlineDiff();
        },
        renderDiff: function(){
            this.wrapper.innerHTML = getTable(this.lines);
        },
        setContent: function(cnt1, cnt2){
            this.cnt1 = cnt1 || '';
            this.cnt2 = cnt2 || '';

            this.getDiff();
            this.renderDiff();
        }
    };

    window.formattedDiffBlock = formattedDiffBlock;
}(this);
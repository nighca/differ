!function(){

    // global observer
    var observer = util.observer;

    var $ = util.$;

    // upload block
    !function(){
        var fileInput1 = $('#file1'),
            fileInput2 = $('#file2'),
            doDiff = $('#do-diff');

        var getContent = function(inputs, cb){
            var left = inputs.length,
                results = [],
                stopped;

            var callback = function(err, result){
                if(stopped) return;

                if(err){
                    stopped = true;
                    cb(err, results);
                }else{
                    left--;
                    results[result.num] = result.cnt;

                    if(!left){
                        stopped = true;
                        cb(null, results);
                    }
                }
            };

            inputs.forEach(function(input, i){
                var file = input.files[0];

                if(!file){
                    callback('No file selected!');
                }

                var reader = new FileReader();

                reader.onload = function(e) {
                    callback(null, {
                        num: i,
                        cnt: this.result
                    });
                };

                reader.readAsText(file);
            });
        };

        doDiff.on('click', function(){
            getContent([fileInput1, fileInput2], function(err, results){
                if(err){
                    throw new Error(err);
                }

                observer.fire('do-diff', results);
            });
        });
    }();

    // diff block
    !function(){

        formattedDiffBlock.init($('#diff-wrapper'));

        observer.on('do-diff', function(cnts){
            formattedDiffBlock.setContent(cnts[0], cnts[1]);
        });
    }();

}();
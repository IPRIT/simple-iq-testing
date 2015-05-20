$(function() {
    if (User.isAuth) {
        Poll.start();
    }
});

var getRandom = function() {
    var args = Array.prototype.slice.call(arguments);
    return Math.floor(Math.random() * (args[1] - args[0] + 1) + args[0])
};

var inArray = function(arr, p_val) {
    for (var i = 0, l = arr.length; i < l; i++)	{
        if (arr[i] == p_val) {
            return true;
        }
    }
    return false;
};


var Poll = {
    length: 10,
    taskLayer: null,
    taskTitle: null,
    taskDescr: null,
    nextTask: null,
    prevTask: null,
    endPoll: null,
    controlsLayer: null,
    questions: [],
    session: {
        currentPosition: 1,
        answers: [],
        generatedTasks: []
    },
    start: function() {
        this.taskLayer = $('#iqTaskLayer');
        this.taskTitle = $('#iqTaskTitle');
        this.taskDescr = $('#iqTask');
        this.nextTask = $('#nextQuestion');
        this.prevTask = $('#previousQuestion');
        this.endPoll = $('#endTestButton');
        this.controlsLayer = $('#pollControls');

        this.controlsLayer.show(0);
        $('.iq__next').hide(0);
        $('.iq__name').show(0).text(User.fullName);

        this.generate();
        this.render(this.session.currentPosition);
    },
    generate: function() {
        while (this.session.generatedTasks.length !== this.length) {
            var rand = getRandom(0, this.length - 1);
            if (!inArray(this.session.generatedTasks, rand)) {
                this.session.generatedTasks.push(rand);
            }
        }
        for (var el in this.session.generatedTasks) {
            if (!this.session.generatedTasks.hasOwnProperty(el)) continue;
            this.session.generatedTasks[el] = Tasks[this.session.generatedTasks[el]];
        }
    },
    render: function(taskPosition) {
        this.taskLayer.empty();
        var task = this.session.generatedTasks[taskPosition - 1];
        switch (task.type) {
            case 'FILL_INPUT':
                this.taskTitle.text("Вопрос " + this.session.currentPosition + " из " + this.length);
                this.taskDescr.html(task.data.text);

                var getImagesHtml = function(imgs) {
                    if (!imgs) {
                        return '';
                    }
                    var resultArr = [];
                    for (var el in imgs) {
                        resultArr.push('<img width="100%" src="' + imgs[el] + '">');
                    }
                    return resultArr.join('');
                };

                var taskHtml = '<div class="iq__task__input-layer">\
                                    <div class="iq__fill-input__images">' + getImagesHtml(task.data.img) + '</div>\
                                    <div class="form-group-info form-block">\
                                        <div class="col-lg-3">\
                                            <input type="text" class="form-control floating-label" id="answer" placeholder="Ответ">\
                                        </div>\
                                    </div>\
                                </div>';
                this.taskLayer.append(taskHtml);
                break;
            case 'FILL_SEQUENCE':
                this.taskTitle.text("Вопрос " + this.session.currentPosition + " из " + this.length);
                this.taskDescr.html(task.data.text);

                var taskHtml = '<div class="iq__task__input-layer">\
                                    <div class="iq__fill-sequence__numbers">' + task.data.sequence.join('&nbsp;&nbsp;&nbsp;') + '</div>\
                                    <div class="iq__fill-sequence__field">\
                                        <div class="form-group-info form-block">\
                                            <div class="col-lg-5">\
                                                <input type="text" class="form-control input-lg" id="answer">\
                                            </div>\
                                        </div>\
                                    </div>\
                                </div>';
                this.taskLayer.append(taskHtml);
                break;
        }
        var curTaskIndex = this.session.currentPosition - 1;
        if (!curTaskIndex) {
            this.prevTask.hide(0);
        } else {
            this.prevTask.show(0);
        }
        if (curTaskIndex === this.length - 1) {
            this.prevTask.show(0);
            this.nextTask.hide(0);
            this.endPoll.show(0);
        } else {
            this.prevTask.show(0);
            this.nextTask.show(0);
            this.endPoll.hide(0);
        }
    },
    signIn: function() {
        var name = $('#inputFirstName').val(),
            surname = $('#inputSurname').val();
        if (!name.length && !surname.length) {
            return;
        }
        User.fullName = surname + ' ' + name;
        User.isAuth = true;
        this.start();
    },
    next: function() {
        if (this.session.currentPosition >= this.length) {
            return;
        }
        var curTaskIndex = this.session.currentPosition - 1,
            taskAnswer = $('#answer').val();
        this.session.answers[curTaskIndex] = taskAnswer;
        this.render(++this.session.currentPosition);
        var curAnswer = this.session.answers[this.session.currentPosition - 1];
        if (curAnswer) {
            $('#answer').val(curAnswer);
        }
        console.log(this.session.answers);
    },
    prev: function() {
        if (this.session.currentPosition <= 1) {
            return;
        }
        var curTaskIndex = this.session.currentPosition - 1,
            taskAnswer = $('#answer').val();
        this.session.answers[curTaskIndex] = taskAnswer;
        this.render(--this.session.currentPosition);
        var curAnswer = this.session.answers[this.session.currentPosition - 1];
        if (curAnswer) {
            $('#answer').val(curAnswer);
        }
        console.log(this.session.answers);
    },
    end: function() {
        var curTaskIndex = this.session.currentPosition - 1,
            taskAnswer = $('#answer').val();
        this.session.answers[curTaskIndex] = taskAnswer;

        var resultScore = 0.0,
            allScore = 0.0,
            el;
        for (el in this.session.generatedTasks) {
            if (!this.session.generatedTasks.hasOwnProperty(el)) continue;
            allScore += this.session.generatedTasks[el].score;
        }
        for (el in this.session.answers) {
            if (!this.session.answers.hasOwnProperty(el)) continue;
            var curTask = this.session.generatedTasks[el];
            if (curTask.data && curTask.data.rightAnswer
                && curTask.data.rightAnswer.toString().toLowerCase().trim() == this.session.answers[el].toString().toLowerCase().trim()) {
                resultScore += curTask.score;
            }
        }
        var calcedIq = Math.floor(50 + resultScore / allScore * 100);

        this.taskTitle.text("Вы завершили тест. Результат будет сохранен в глобальную статистику.");
        this.taskDescr.html("Ваш IQ составляет");
        this.taskLayer.empty().append('<h2 style="text-align: center">' + calcedIq + '</h2><br><br>минимальный балл — 50,<br>максимальный балл — 150<br>' +
            '<div style="text-align: center; margin-top: 20px;">' +
            '<a id="saveResult" href="javascript:void(0)" class="btn btn-info btn-raised"><b>Сохранить результат</b></a>' +
            '</div>');
        this.controlsLayer.hide(0);
        $('#saveResult').on('click', function() {
            var submitForm = $('#submitForm');
            $('#fullname').val(User.fullName);
            $('#score').val(calcedIq);
            submitForm.submit();
        });
    }
};
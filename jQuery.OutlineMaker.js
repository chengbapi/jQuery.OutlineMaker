(function($) {
    var
        defaults = {
            target: document.body,
            levels: ['h1', 'h2', 'h3', 'h4'],
            offset: 300
        };


    function Title(target, outline) {
        this.initAttr(target, outline);
        this.initDOM();

        outline.insertPoint = this;
    }

    $.extend(Title.prototype, {
        initAttr: function (target, outline) {
            this.$target = $(target);
            this.initText();
            this.initLevel(outline.options.levels);
            this.initSup(outline.insertPoint);
        },
        initText: function() {
            var text = this.$target.data('text');
            return this.text = text ? text : this.$target.text();
        },
        initLevel: function(levels) {
            var i;
            for (i = 0; i < levels.length; i++) {
                if (this.$target.is(levels[i])) {
                    return this.level = i + 1;
                }
            }
        },
        initSup: function(insertPoint) {
            while (insertPoint.level >= this.level) {
                insertPoint = insertPoint.sup;
            }
            this.sup = insertPoint;
            this.sup.addSub(this);
        },
        initDOM: function() {
            this.DOM = $("<li><span class='hook'>" + this.text + "</span></li>").data("model", this);
            return this.DOM;
        },
        refreshPos: this.initPos,
        addSub: function(sub) {
            if (!this.subs) {
                this.subs = [];
            }
            return this.subs.push(sub);
        }

    });

    function Outline(options, roottarget) {
        var self = this,
            allTitles,
            levelsStargetctor;

        this.options = $.extend({}, defaults, options);
        this.root = { level: 0, subs: [], addSub: Title.prototype.addSub };
        this.root.DOM = $("<div class='outline-maker'></div>");
        this.insertPoint = this.root;

        levelsStargetctor = this.options.levels.join(',');
        allTitles = $(levelsStargetctor, roottarget);

        this.titles = []; /* a flat array for calculating */

        allTitles.each(function(v, i, a) {
            self.titles.push(new Title(this, self));
        });

        /* render DOM */
        this.DOM = recurseRender(this.root);

        $(this.options.target).append(this.DOM)

        this.bindEvent();

        this.refreshPos();
    }

    $.extend(Outline.prototype, {
        refresh: function() {
            $(window).trigger("scroll");
        },
        to: function(title) {
            console.log(title);
            // scroll window to particular position
            $(window).scrollTop(title.pos.top);
            // render outline
            this.render(title);
        },
        render: function(title) {
            this.DOM.find("*").removeClass("active");
            while (title && title.DOM) {
                title.DOM.addClass("active");
                title = title.sup;
            }
        },
        refreshPos: function() {
            $.each(this.titles, function(i, title) {
                var offset = title.$target.offset();
                title.pos = {
                    top: offset.top,
                    left: offset.left
                }
            });
            this.refresh();
        },
        bindEvent: function() {
            var self = this;
            // outline click event
            $(this.DOM).on("click", "li", function(e) {
                self.to($(this).data("model"));
                e.stopPropagation();
            });
            // window scroll / resize event
            $(window).on("scroll", function() {
                var i,
                    titles = self.titles,
                    scrollTop = $(this).scrollTop(),
                    scrollLeft = $(this).scrollLeft();

                self.render(getCurrentTitle(titles, scrollTop, scrollLeft, self.options.offset));
            });
            $(window).on("resize", function() {
                self.refreshPos();
                self.refresh();
            });
        }
    });

    function recurseRender(title) {
        var i,
            ul,
            subs = title.subs;
        if (subs) {
            ul = $("<ul></ul>");
            title.DOM.append(ul);
            for (i = 0; i < subs.length; i++) {
                ul.append(subs[i].DOM);
                recurseRender(subs[i]);
            }
        }
        return title.DOM;
    }

    function getCurrentTitle(titles, scrollTop, scrollLeft, offset) {
        var i,
            prev,
            next;
        if (titles[0].pos.top >= scrollTop) {
            return titles[0];
        }

        for (i = 0; i + 1 < titles.length; i++) {
            prev = titles[i];
            next = titles[i + 1];
            if (prev.pos.top < scrollTop && next.pos.top > scrollTop) {
                if (next.pos.top - scrollTop < offset ) {
                    return next;
                } else {
                    return prev;
                }
            }
        }
        return next;
    }

    function OutlineMaker(options) {
        return new Outline(options, this);
    }

    $.fn.extend({
        OutlineMaker: OutlineMaker
    });
})(jQuery);

;(function(window)){
    var
        _config = {
            target: document.body,
            levels: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
            offset: 300
        };


    function Header(origin, outline) {
        this.initAttr(origin, outline);
        this.initDOM();

        outline.insertPoint = this;
    }

    $.extend(Header.prototype, {
        initAttr: function (origin, outline) {
            this.origin = origin;
            this.initText();
            this.initLevel(outline.config.levels);
            this.initSup(outline.insertPoint);
        },
        initText: function() {
            var text = this.origin.dataset.text;
            return this.text = text ? text : this.origin.innerHTML;
        },
        initLevel: function(levels) {
            var i;
            for (i = 0; i < levels.length; i++) {
/*
                if (this.origin.is(levels[i])) {
                    return this.level = i + 1;
                }
*/
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
            var 
                li = document.createElement('li'),
                span = document.createElement('span');

            Util.addClass(span, "hook");
            span.innerHTML = this.text;
            
/*
            Util.cache
            this.DOM = $("<li><span class='hook'>" + this.text + "</span></li>").data("model", this);
*/
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

    function Outline(rootTarget, config) {
        var self = this,
            origins,
            levelSelector;
/*
        this.config = $.extend({}, _config, config);

*/
        this.root = { level: 0, subs: [], addSub: Header.prototype.addSub };
        this.root.DOM = $("<div class='outline-maker'></div>");
        this.root.DOM = document.createElement('div');
        Util.addClass(this.root.DOM, "outline-maker");
        this.insertPoint = this.root;

        levelSelector = this.config.levels.join(',');

        origins = rootTarget.querySelectorAll(levelSelector);
        origins = [].slice.apply(origins);

        this.headers = []; /* a flat array for calculating */
        
        origins.forEach(function(origin, i, origins) {
            self.headers.push(new Header(origin, self));
        });

        /* render DOM */
        this.DOM = recurseRender(this.root);

        $(this.config.target).appendChild(this.DOM);

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
            $.each(this.headers, function(i, title) {
                var offset = title.$origin.offset();
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
                    headers = self.headers,
                    scrollTop = $(this).scrollTop(),
                    scrollLeft = $(this).scrollLeft();

                self.render(getCurrentHeader(headers, scrollTop, scrollLeft, self.config.offset));
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

    function getCurrentHeader(headers, scrollTop, scrollLeft, offset) {
        var i,
            prev,
            next;
        if (headers[0].pos.top >= scrollTop) {
            return headers[0];
        }

        for (i = 0; i + 1 < headers.length; i++) {
            prev = headers[i];
            next = headers[i + 1];
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

    function OutlineMaker(rootTarget, config) {
        return new Outline(rootTarget, config);
    }

    window.OutlineMaker = OutlineMaker;

})(window);

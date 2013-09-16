;(function($) {
    var
        _config = {
            target: document.body,
            levels: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
            host: window,
            offset: 300,
            number: false,
            numberSplit: '.',
            deep: false
        };

    function Header(origin, outline) {
        this.$origin = $(origin);
        this.initLevel(outline.config.levels);
        this.initSup(outline.insertPoint);
        this.initNumber();
        this.initText(outline.config);
        this.initDOM();
    }

    $.extend(Header.prototype, {
        initLevel: function(levels) {
            var i;
            for (i = 0; i < levels.length; i++) {
                if (this.$origin.is(levels[i])) {
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
        initNumber: function() {
            this.number = this.sup.number.concat(this.sup.subs.length);
        },
        initText: function(config) {
            var number;

            this.text = this.$origin.data('text') || this.$origin.text();
            if (config.number) {
                number = this.number.join(config.numberSplit);
                this.text = "<span class='number'>" + number + "</span>" + this.text;
                console.log(this.text);
            }


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


    /**
     * Class making a outline with given config in rootTarget
     * @param {Object} config to init outline
     * @param {jQuery.Element} search headers from this jQuery.Element
     * @constructor
     */

    /**
     * Sample of config
     * config = {
     *     levels: {Array.<QuerySelector>}
     *     target: {Element} dest where to put outline
     *     host: {Element} add scroll event listener on this host
     *     offset: {Number} when the margin between top of header and top border
     *             of host less than offset will trigger render event
     *     number: add number index before header
     *     deep: {Boolean} whether to search headers recursely in rootTarget
     * }
     */

    function Outline(config, rootTarget) {
        var self = this,
            origins,
            levelSelector;

        this.config = $.extend({}, _config, config);

        this.host = $(this.config.host);
        this.root = { level: 0, subs: [], number: [], addSub: Header.prototype.addSub };
        this.root.DOM = $("<div class='outline-maker'></div>");
        this.insertPoint = this.root;

        levelSelector = this.config.levels.join(',');

        if (this.config.deep) {
            origins = $(levelSelector, rootTarget);
        } else {
            origins = $(rootTarget).children(levelSelector);
        }

        this.headers = []; /* a flat array for calculating */

        origins.each(function(i, origin) {
            var header = new Header(origin, self)
            self.headers.push(header);
            self.insertPoint = header;
        });

        /* render DOM */
        this.DOM = recurseRender(this.root);

        $(this.config.target).append(this.DOM)

        this.bindEvent();

        this.refreshPos();
    }

    $.extend(Outline.prototype, {
        refresh: function() {
            $(this.host).trigger("scroll");
        },
        to: function(title) {
            // scroll window to particular position
            $(this.host).scrollTop(title.pos.top);
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
            var self = this;
            $.each(this.headers, function(i, title) {
                var
                    hostOffset = self.host.offset(),
                    offset = title.$origin.offset();

                // when host is window or document
                // host.offset() return undefinded
                if (!hostOffset) {
                    hostOffset = {
                        top: 0,
                        left: 0
                    }
                }

                title.pos = {
                    top: offset.top - hostOffset.top,
                    left: offset.left - hostOffset.left
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
            $(this.host).on("scroll", function() {
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

    function OutlineMaker(config) {
        return new Outline(config, this);
    }

    $.fn.extend({
        OutlineMaker: OutlineMaker
    });
})(jQuery);

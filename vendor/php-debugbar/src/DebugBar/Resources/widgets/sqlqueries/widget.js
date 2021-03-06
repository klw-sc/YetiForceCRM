(function ($) {

	var csscls = PhpDebugBar.utils.makecsscls('phpdebugbar-widgets-');

	/**
	 * Widget for the displaying sql queries
	 *
	 * Options:
	 *  - data
	 */
	var SQLQueriesWidget = PhpDebugBar.Widgets.SQLQueriesWidget = PhpDebugBar.Widget.extend({
		className: csscls('sqlqueries'),
		onFilterClick: function (el) {
			$(el).toggleClass(csscls('excluded'));

			var excludedLabels = [];
			this.$toolbar.find(csscls('.filter') + csscls('.excluded')).each(function () {
				excludedLabels.push(this.rel);
			});

			this.$list.$el.find("li[connection=" + $(el).attr("rel") + "]").toggle();

			this.set('exclude', excludedLabels);
		},
		render: function () {
			this.$status = $('<div />').addClass(csscls('status')).appendTo(this.$el);

			this.$toolbar = $('<div></div>').addClass(csscls('toolbar')).appendTo(this.$el);

			var filters = [], self = this;

			this.$list = new PhpDebugBar.Widgets.ListWidget({itemRenderer: function (li, stmt) {
					$('<code />').addClass(csscls('sql')).html(PhpDebugBar.Widgets.highlight(stmt.sql, 'sql')).appendTo(li);
					if (stmt.duration_str) {
						$('<span title="Duration" />').addClass(csscls('duration')).text(stmt.duration_str).appendTo(li);
					}
					if (stmt.memory_str) {
						$('<span title="Memory usage" />').addClass(csscls('memory')).text(stmt.memory_str).appendTo(li);
					}
					if (typeof (stmt.row_count) != 'undefined') {
						$('<span title="Row count" />').addClass(csscls('row-count')).text(stmt.row_count).appendTo(li);
					}
					if (typeof (stmt.stmt_id) != 'undefined' && stmt.stmt_id) {
						$('<span title="Prepared statement ID" />').addClass(csscls('stmt-id')).text(stmt.stmt_id).appendTo(li);
					}
					if (stmt.connection) {
						$('<span title="Connect type: '+stmt.connectType+' | Database name: '+stmt.dbName+' | Driver name: '+stmt.driverName+'" />').addClass(csscls('database')).text(stmt.connection).appendTo(li);
						li.attr("connection", stmt.connection);
						if ($.inArray(stmt.connection, filters) == -1) {
							filters.push(stmt.connection);
							$('<a />')
									.addClass(csscls('filter'))
									.text(stmt.connection)
									.attr('rel', stmt.connection)
									.on('click', function () {
										self.onFilterClick(this);
									})
									.appendTo(self.$toolbar);
							if (filters.length > 1) {
								self.$toolbar.show();
								self.$list.$el.css("margin-bottom", "20px");
							}
						}
					}
					if (typeof (stmt.is_success) != 'undefined' && !stmt.is_success) {
						li.addClass(csscls('error'));
						li.append($('<span />').addClass(csscls('error')).text("[" + stmt.error_code + "] " + stmt.error_message));
					}
					var moreInfo = false;
					var tableP = $('<table><tr><th colspan="2">Params</th></tr></table>');
					var tableB = $('<table><tr><th>BackTrace</th></tr></table>');
					if (stmt.params && !$.isEmptyObject(stmt.params)) {
						tableP.addClass(csscls('params')).appendTo(li);
						for (var key in stmt.params) {
							if (typeof stmt.params[key] !== 'function') {
								tableP.append('<tr><td class="' + csscls('name') + '">' + key + '</td><td class="' + csscls('value') +
										'">' + stmt.params[key] + '</td></tr>');
							}
						}
						moreInfo = true;
					}
					if (stmt.backtrace && !$.isEmptyObject(stmt.backtrace)) {
						tableB.addClass(csscls('params')).appendTo(li);
						tableB.append('<tr><td class="' + csscls('name') + '">' + stmt.backtrace + '</td></tr>');
						moreInfo = true;
					}
					if (moreInfo) {
						li.css('cursor', 'pointer').click(function () {
							if (tableP.is(':visible')) {
								tableP.hide();
							} else {
								tableP.show();
							}
							if (tableB.is(':visible')) {
								tableB.hide();
							} else {
								tableB.show();
							}
						});
					}
				}});
			this.$list.$el.appendTo(this.$el);

			this.bindAttr('data', function (data) {
				this.$list.set('data', data.statements);
				this.$status.empty();
				if(data.length === 0){
					return;
				}
				// Search for duplicate statements.
				for (var sql = {}, duplicate = 0, i = 0; i < data.statements.length; i++) {
					var stmt = data.statements[i].sql;
					if (data.statements[i].params && !$.isEmptyObject(data.statements[i].params)) {
						stmt += ' {' + $.param(data.statements[i].params, false) + '}';
					}
					sql[stmt] = sql[stmt] || {keys: []};
					sql[stmt].keys.push(i);
				}
				// Add classes to all duplicate SQL statements.
				for (var stmt in sql) {
					if (sql[stmt].keys.length > 1) {
						duplicate++;
						for (var i = 0; i < sql[stmt].keys.length; i++) {
							this.$list.$el.find('.' + csscls('list-item')).eq(sql[stmt].keys[i])
									.addClass(csscls('sql-duplicate')).addClass(csscls('sql-duplicate-' + duplicate));
						}
					}
				}

				var t = $('<span />').text(data.nb_statements + " statements were executed").appendTo(this.$status);
				if (data.nb_failed_statements) {
					t.append(", " + data.nb_failed_statements + " of which failed");
				}
				if (duplicate) {
					t.append(", " + duplicate + " of which were duplicated");
				}
				if (data.accumulated_duration_str) {
					this.$status.append($('<span title="Accumulated duration" />').addClass(csscls('duration')).text(data.accumulated_duration_str));
				}
				if (data.memory_usage_str) {
					this.$status.append($('<span title="Memory usage" />').addClass(csscls('memory')).text(data.memory_usage_str));
				}
			});
		}

	});

})(PhpDebugBar.$);

const PREC = {
    ASSIGN: 15,
    BOOLEAN: 35,
    RELATIONAL: 40,
    CALL: 50,
    ARITHMETIC: 70
};

module.exports = grammar({
    name: "magik",

    rules: {
	source_file: $ =>
	    repeat(
		choice(
		    $.package,
		    $.fragment)
	    ),

	fragment: $ =>
	    prec.left(seq(repeat1($._top_level_statement), optional(seq("$\n")))),

	package: $ =>
	    prec.left(seq("_package", $._identifier, repeat($.fragment))),


	// [_private] _method <receiver>.<message_name> [( <arguments> )]
	//  <block body>
	// _endmethod
	method: $ =>
	    prec.left(
		seq(
		    optional($.pragma),
		    optional("_abstract"),
		    optional("_private"),
		    optional("_iter"),
		    "_method",
		    field("exemplarname", $.identifier),
		    ".",
		    field("name", $.identifier),
		    optional($.parameter_list),
		    $._terminator,
		    optional($.documentation),
		    optional($._codeblock),
		    "_endmethod"
		)
	    ),

	// _proc [@ <identifier>] ( [ <arguments> ] )
	// <block body>
	// _endproc
	procedure: $ =>
	    seq("_proc",
		optional(field("name", seq("@", $._identifier))),
		$.parameter_list,
		optional($._codeblock),
		"_endproc"
	    ),

	parameter_list: $ =>
	    choice(
		seq("(",
		    optional(seq($.parameter, repeat(seq(",", $.parameter)))),
		    optional(seq(optional(","), "_optional", $.parameter, repeat(seq(",", $.parameter)))),
		    optional(seq(optional(","), "_gather", $.parameter)),
		    ")"
		),
		seq("<<", seq($.parameter, repeat(seq(",", $.parameter))))
	    ),

	parameter: $ => $._identifier,

	// _block [ @ <identifier> ]
	//   <statements>
	//   [ >> <rvalue tuple> ]
	// _endblock
	block: $ =>
	    prec.left(
		seq("_block", optional($._codeblock), "_endblock")
	    ),

	assignment: $ =>
	    prec.left(PREC.ASSIGN,
		seq($._expression,
		    choice("<<", "_and<<", "_or<<", "_xor<<", "**<<", "*<<", "_mod<<", "_div<<", "-<<", "+<<"),
		    $._expression)
	    ),

	// _if <condition1>
	// _then
	//  <block body>
	// [ _elif <condition2>
	//   _then
	//     <block body> ]
	//     ...
	// [ _else
	//   <block body> ]
	// _endif
	if: $ =>
	    seq("_if",
		field("condition", $._expression),
		"_then",
		optional($._codeblock),
		repeat($.elif),
		optional($.else),
		"_endif"
	    ),

	elif: $ => seq("_elif", field("condition", $._expression), "_then", optional($._codeblock)),

	else: $ => seq("_else", optional($._codeblock)),

	// _loop [ @ <identifier> ]
	//  <block body>
	// _endloop
	loop: $ =>
	    seq(
		"_loop",
		optional($._codeblock),
		"_endloop"
	    ),

	// _handling condition _with procedure
	handling: $ =>
	    seq("_handling", choice(
		"_default",
		seq(field("condition", $._expression), repeat(seq(",", field("condition", $._expression))), "_with", choice("_default" , $._expression)))
	    ),

	// _catch <expression>
	//  <block body>
	// _endcatch
	catch: $ => seq("_catch", $._expression, $._terminator, optional($._codeblock), "_endcatch"),

	// _throw <expression> [ _with <rvalue tuple> ]
	throw: $ => seq("_throw", $._expression, optional(seq("_with", $._expression))),

	// [ _for <lvalue tuple> ] _over <iter invocation>
	// _loop [ @<identifier> ]
	//  <block body>
	// [ _finally [ _with <lvalue tuple> ]
	//  <block body> ]
	// _endloop
	iterator: $ =>
	    seq(
		optional(seq("_for", $.identifier, repeat(seq(",", $.identifier)))),
		"_over", $._expression,
		$.loop
	    ),

	// _try [ _with <name list> ]
	//   <block body 0>
	// _when <name list1>
	//   <block body 1>
	// _endtry
	try: $ =>
	    seq(
		"_try",
		optional(seq("_with", field("condition", $._identifier))),
		optional($._codeblock),
		repeat(seq("_when",
		    field("raised_condition", $._identifier), repeat(seq(",", field("raised_condition", $._identifier))),
		    optional($._codeblock))),
		"_endtry"
	    ),

	loopbody: $ =>
	    seq(
		"_loopbody", "(",
		$._expression,
		")"
	    ),

	// _leave [ @ <identifier> ] [_with <rvalue tuple> ]
	leave: $ =>
	    seq(
		"_leave",
		optional(seq("@", $._identifier)),
		optional(seq("_with", choice(
		    seq("(", seq($._expression, repeat1(seq(",", $._expression))), ")"),
		    $._expression)))
	    ),

	// _continue _with <rvalue tuple>
	continue: $ =>
	    seq(
		"_continue",
		optional(seq("@", $._identifier)),
		optional(seq("_with", choice(
		    seq("(", seq($._expression, repeat1(seq(",", $._expression))), ")"),
		    $._expression)))
	    ),

	// _protect [ _locking <expression> ]
	//   <block body>
	// _protection
	//   <block body>
	// _endprotect
	protect: $ =>
	    seq(
		"_protect",
		optional(seq("_locking", $._expression, $._terminator)),
		optional($._codeblock),
		"_protection",
		optional($._codeblock),
		"_endprotect"
	    ),

	// _lock <expression>
	//   <block body>
	// _endlock
	lock: $ =>
	    seq(
		"_lock",
		seq($._expression, $._terminator),
		optional($._codeblock),
		"_endlock"
	    ),

	// _pragma (classify_level=<level>, topic={<set of topics>}, [ usage={<set of usages>} ] )
	pragma: $ => seq("_pragma(", /.*/, ")"),

	_literal: $ =>
	    choice(
		$.true,
		$.false,
		$.maybe,
		$.character_literal,
		$.string_literal,
		$.number,
		$.unset,
		$.super,
		$.self,
		$.clone,
		$.symbol,
		$.vector
	    ),

	string_literal: $ =>
	    choice(
		seq('"', repeat(choice(/[^"\n]/, /\\(.|\n)/)), '"'),
		seq("'", repeat(choice(/[^'\n]/, /\\(.|\n)/)), "'")
	    ),

	call: $ =>
	    prec.right(PREC.CALL,
		seq(
		    field("receiver", $._expression),
		    field("operator", "."),
		    field("message", $.identifier),
		    optional(choice(
			seq("(", optional($._expression_list), ")"),
			seq("<<", optional($._expression_list))))
		)
	    ),

	invoke: $ => prec.right(PREC.CALL,
	    seq(
		field("receiver", $._expression),
		seq("(", optional($._expression_list), ")"))
	),

	indexed_access: $ =>
	    prec.left(PREC.CALL,
		seq(
		    field("receiver", $._expression),
		    field("index", seq("[", optional($._expression_list), "]"))
		)
	    ),

	slot_accessor: $ => prec.left(seq(".", /[a-z][a-z0-9_\?!]*/)),

	_expression_list: $ =>
	    prec.right(seq($._expression, repeat(seq(",", $._expression)))),

	true: $ => "_true",
	false: $ => "_false",
	maybe: $ => "_maybe",
	unset: $ => "_unset",
	super: $ => "_super",
	self: $ => "_self",
	clone: $ => "_clone",

	_terminator: $ =>
	    choice(";", "\n"),

	_top_level_statement: $ => choice(
	    $._definition,
	    $.method,
	    $._statement
	),

	_statement: $ => choice(
	    $.comment,
	    $.handling,
	    $.return,
	    $.leave,
	    $.continue,
	    $.catch,
	    $.throw,
	    seq($._expression, $._terminator)
	),

	_codeblock: $ => repeat1(choice($._statement, $._defvar)),

	_defvar: $ => choice(
	    $.local,
	    $.constant,
	    $.dynamic_import,
	    $.dynamic,
	    $.global,
	    $.import),

	global: $ => seq("_global", $.identifier, repeat(seq(",", $.identifier))),

	local: $ => seq("_local", $.identifier, repeat(seq(",", $.identifier))),

	constant: $ => seq("_constant",
	    choice(
		$.local,
		seq($.identifier, repeat(seq(",", $.identifier))))),

	dynamic: $ => seq("_dynamic", $.dynamic_variable, repeat(seq(",", $.identifier))),

	import: $ => seq("_import", repeat(seq(",", $.identifier))),
	
	dynamic_import: $ => seq("_dynamic", "_import", $.dynamic_variable, repeat(seq(",", $.dynamic_variable))),

	return: $ =>
	    prec.left(
		choice(
		    seq("_return", optional($._expression)),
		    seq(">>", $._expression)
		)
	    ),

	_definition: $ =>
	    prec(1,seq($.pragma,
		optional($.documentation),
		choice(
		    $.invoke,
		    $.call))
	    ),

	gather: $ => seq("_gather", $._expression),
	scatter: $ => seq("_scatter", $._expression),
	allresults: $ => seq("_alresults", $._expression),

	parenthesized_expression: $ => seq('(', $._expression, ')'),

	_expression: $ =>
	    choice(
		$.parenthesized_expression,
		$.procedure,
		$.block,
		$.call,
		$.invoke,
		$.slot_accessor,
		$.indexed_access,
		$.gather,
		$.scatter,
		$.allresults,
		$.iterator,
		$.if,
		$.loop,
		$.try,
		$.loopbody,
		$.protect,
		$.lock,
		$.assignment,
		$.logical_operator,
		$.relational_operator,
		$.arithmetic_operator,
		$.unary_operator,
		$._literal,
		$._variable
	    ),

	_variable: $ =>
	    choice(
		$.dynamic_variable,
		$.global_variable,
		$.global_reference,
		$.variable
	    ),

	variable: $ => prec.left($._identifier),

	dynamic_variable: $ =>
	    /![a-z0-9_\?!]*!/,

	global_variable: $ =>
	    seq($._identifier, ":", $._identifier),

	global_reference: $ =>
	    /@[a-z0-9_\?!]*/,

	identifier: $ => $._identifier,

	_identifier: $ => prec(-2, /[a-z][a-z0-9_\?!]*/),

	number: $ => /\d+/,

	vector: $ => seq(
	    '{',
	    optional($._expression_list),
	    '}'
	),

	relational_operator: $ =>
	    prec.right(PREC.RELATIONAL,
		seq(
		    field("left", $._expression),
		    field("operator", choice("_is", "_isnt", "_cf", "=", "~=", "<>", ">=", "<=", "<", ">")),
		    field("right", $._expression)
		)
	    ),

	logical_operator: $ =>
	    prec.left(PREC.BOOLEAN,
		seq(
		    field("left", $._expression),
		    field("operator", choice("_and", "_or", "_xor", "_andif", "_orif", "_xorif")),
		    field("right", $._expression)
		)
	    ),

	arithmetic_operator: $ =>
	    prec.left(PREC.ARITHMETIC,
		seq(
		    field("left", $._expression),
		    field("operator", choice("**", "*", "_mod", "_div", "-", "+")),
		    field("right", $._expression)
		)
	    ),

	unary_operator: $ =>
	    seq(field("operator", choice("+", "-", "_not", "~")), $._expression),

	symbol: $ =>
	    seq(':', choice(
		seq('|', repeat(choice(/[^\\"\n]/, /\\(.|\n)/)), '|'),
		$._identifier)),

	character_literal: $ => seq('%', choice($._identifier, /./)),

	documentation: $ => repeat1(/##.*/),
	comment: $ => prec.right(repeat1(/#.*/)),
    },
});

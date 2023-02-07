module.exports = grammar({
    name: 'magik',

    rules: {
	source_file: $ =>
	    repeat(
		choice(
		    $._definition,
		    $._literal,
		    $.block
		),
	    ),

	_definition: $ =>
	    choice(
		$.method_declaration
	    ),

	method_declaration: $ =>
	    seq(
		'_method',
		field('exemplarname', $.identifier),
		'.',
		field('name', $.identifier),
		optional($.parameter_list),
		repeat($._statement),
		'_endmethod',
		optional('\n$\n')
	    ),

	parameter_list: $ =>
	    choice(
		seq(
		    '(',
		    optional(
			seq(
			    commaSep1($.parameter),
			    optional(',')
			)
		    ),
		    ')'
		),
		seq(
		    '<<',
		    seq(
			commaSep1($.parameter),
			optional(',')
		    )
		)
	    ),

	parameter: $ => $.identifier,

	block: $ =>
	    seq(
		'_block',
		repeat($._statement),
		'_endblock',
		optional('\n$\n')
	    ),

	_literal: $ =>
	    choice(
		$.true,
		$.false,
		$.maybe,
		//	    $.character_literal,
		$.string_literal,
		$.number,
		$.unset
	    ),

	string_literal: $ =>
	    token(
		choice(
		    seq('"', repeat(choice(/[^\\"\n]/, /\\(.|\n)/)), '"'),
		    seq('\'', repeat(choice(/[^\\"\n]/, /\\(.|\n)/)), '\'')
		)
	    ),

	true: $ => '_true',
	false: $ => '_false',
	maybe: $ => '_maybe',
	unset: $ => '_unset',

	_statement: $ =>
	    choice(
		$.return_statement
		// TODO: other kinds of statements
	    ),

	return_statement: $ =>
	    choice(
		seq('_return', optional($._expression)),
		seq('>>', $._expression)
	    ),

	_expression: $ =>
	    choice(
		$.identifier,
		$._literal
		// TODO: other kinds of expressions
	    ),

	identifier: $ => /[a-z_][a-z0-9_]*/,

	number: $ => /\d+/
    }
})

function commaSep1(rule) {
    return sep1(rule, ',')
}

function sep1(rule, separator) {
    return seq(rule, repeat(seq(separator, rule)))
}

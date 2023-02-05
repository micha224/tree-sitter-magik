module.exports = grammar({
    name: 'magik',

    rules: {
	source_file: $ => repeat(
	    choice(
		$._definition,
		$.block
	    ),
	),
	
	_definition: $ => choice(
	    $.method_declaration
	),

	method_declaration: $ => seq(
	    '_method',
	    field('exemplarname', $.identifier),
	    '.',
	    field('name', $.identifier),
	    $.parameter_list,
	    repeat($._statement),
	    '_endmethod',
	    optional('\n$\n')
	),

	parameter_list: $ => seq(
	    '(',
	    // TODO: parameters
	    ')'
	),

	block: $ => seq(
	    '_block',
	    repeat($._statement),
	    '_endblock',
	    optional('\n$\n')
	),

	string_literal: $ => token(choice(
	    seq('"', repeat(choice(/[^\\"\n]/, /\\(.|\n)/)), '"'),
	    seq('\'', repeat(choice(/[^\\"\n]/, /\\(.|\n)/)), '\'')
	)),

	_statement: $ => choice(
	    $.return_statement
	    // TODO: other kinds of statements
	),

	return_statement: $ => seq(
	    choice(
		'_return',
		'>>'
	    ),
	    $._expression
	),

	_expression: $ => choice(
	    $.identifier,
	    $.number,
	    $.string_literal
	    // TODO: other kinds of expressions
	),

	identifier: $ => /[a-z|_]+/,

	number: $ => /\d+/
    }
});

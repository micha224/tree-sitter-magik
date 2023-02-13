; Methods

(method_declaration
  exemplarname: (identifier) @type)
(method_declaration
  name: (identifier) @function.method)

; Literals

[
  (number)
] @number

[
  (string_literal)
] @string

[
  (true)
  (false)
  (maybe)
  (unset)
] @constant.builtin

[
 (self)
 (super)
] @variable.builtin

(documentation) @attribute
(comment) @comment
(pragma) @attribute

; Expression

(call
  receiver: (identifier) @variable.parameter)
(call 
  operator: "." @operator)
(call
  message: (identifier) @function)

; Keywords

[
  "_method"
  "_endmethod"

  "_block"
  "_endblock"

  "_if"
  "_then"
  "_elif"
  "_else"
  "_endif"
  
  "_return"
] @keyword

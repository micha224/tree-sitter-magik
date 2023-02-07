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

; Keywords

[
  "_method"
  "_endmethod"
  "_block"
  "_endblock"
  "_return"
] @keyword

---
title: "Checking register projection names in ansible-lint"
slug: "lint-the-keys-not-the-mapping"
date: 2026-10-08
seriesMonth: "2026-07"
excerpt: "ansible-lint #5110: a newer register syntax made var-naming check a whole mapping as if it were one variable name."
tags: ["python", "open-source", "testing", "infrastructure"]
category: "Infrastructure"
featured: false
status: "published"
---

This note explains [ansible-lint #5110](https://github.com/ansible/ansible-lint/pull/5110), merged in July 2026. I wrote it in October. It is a small fix to a rule that met a new shape of input.

## The new syntax

In Ansible, `register` stores a task's result in a variable. Usually it is a single name:

```yaml
- name: Read the release file
  ansible.builtin.command: cat /etc/os-release
  register: os_release
```

Newer ansible-core versions also accept a mapping, called a register projection. Each key is a variable to create and each value is an expression over the task result:

```yaml
- name: My task
  register:
    reg_var1: _task.result
  ansible.builtin.debug:
    msg: hello
```

## What the rule did with it

The `var-naming` rule checks that variable names are strings and follow the naming pattern. It took the value of `register` and checked it as one name. With a projection, that value is a dictionary, so the rule reported:

```text
var-naming[non-string]: Variables names must be strings.
(register: {'reg_var1': '_task.result', '__file__': PosixPath('playbooks/test.yml')})
```

[Issue #5093](https://github.com/ansible/ansible-lint/issues/5093) shows this message. The error is technically true, a dictionary is not a string, but it is about the wrong thing. The names that matter are the keys.

The message also contains `__file__`. ansible-lint adds metadata keys like this one to the mappings it loads. A fix that simply iterated over the dictionary would have checked that key as if the playbook author had written it.

## The change

The rule now treats both forms the same way: a list of names to check. A string becomes a single name; a mapping contributes its keys, and keys starting with `__` are skipped as parser metadata.

```python
registered_vars = (
    registered_var.keys()
    if isinstance(registered_var, dict)
    else (registered_var,)
)
for key in registered_vars:
    if isinstance(key, str) and key.startswith("__"):
        continue
    ...
```

Each key is checked with the existing naming function, so a projection key such as `BadName` still fails with the same rule and the same role-prefix handling as a plain `register`. The error now names the key, and it keeps the task's line number.

## Test

The repository already had a playbook fixture with a register projection in its schema tests. The new test runs `var-naming` against that fixture and expects no findings. The rule is run through the normal runner, so the metadata keys are present just as they are in real use.

## What I took from it

A lint rule encodes an assumption about the shape of its input. When the language adds a form, the rule needs to be told what the meaningful part of the new form is; otherwise it reports a problem with the data structure instead of the code. In this case the meaningful part was the keys, and the loader's own metadata had to stay out of the check. I wrote about a similar question of ownership in [a cfn-lint note](/articles/lint-at-the-owning-layer/).

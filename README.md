# stay-kit

One property-site system, many properties.

A property repo holds its content, its photographs, an accent colour and a mark.
Everything else lives here: the design system, the blocks, nine opt-in modules,
and the verification harness every property ships against.

## Consuming it

Pin it by git ref in the property's `package.json`, the same way `web-kit` is
consumed elsewhere. A property takes an upgrade by bumping the ref, never by
surprise.

## Verifying a property

```bash
STAY_KIT_SECRETS="<comma separated>" npx stay-kit verify \
  --url https://the-site.vercel.app --routes /,/apply,/guidebook,/rules
```

Blocking: naming, secret leaks, hero fill across 13 geometries, the geometry
matrix, accessibility. Performance reports its numbers and never blocks.

A check that cannot run counts as a failure, never a pass.

## The credential rule

A credential is a `Secret`, an opaque box. React cannot render it, a template
literal cannot interpolate it, and the value sits behind a non-enumerable
symbol. `validateProperty` refuses a secret declared anywhere but `arrival`,
only the arrival module may open one, and `stay-kit verify` fetches every
public route to prove none appears in served HTML.

This exists because a property site once put a gate code and a wifi password
into public HTML. A noindex tag is not access control.

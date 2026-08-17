import Image from "next/image";

/**
 * A photograph in a grid cell. `cap` is optional and only earns its place when
 * it adds a fact the picture cannot state on its own.
 */
export function Fig({
  src,
  alt,
  cap,
  className,
  sizes = "(max-width: 900px) 50vw, 33vw",
  priority = false,
}: {
  src: string;
  alt: string;
  cap?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <figure className={`figure${className ? " " + className : ""}`}>
      <Image src={src} alt={alt} fill sizes={sizes} priority={priority} style={{ objectFit: "cover" }} />
      {cap ? <figcaption className="cap">{cap}</figcaption> : null}
    </figure>
  );
}

import { Project, type SourceFile, ts } from "ts-morph"

const project = new Project({
  useInMemoryFileSystem: true,
  compilerOptions: { jsx: ts.JsxEmit.Preserve },
})

let counter = 0

/** Parses TSX source into an in-memory ts-morph SourceFile (syntax only). */
export function parseSource(
  text: string,
  fileName = "component.tsx"
): SourceFile {
  counter += 1
  return project.createSourceFile(`/${counter}/${fileName}`, text, {
    overwrite: true,
  })
}

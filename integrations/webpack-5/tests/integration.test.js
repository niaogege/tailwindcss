let $ = require('../../execute')
let { css, html, javascript } = require('../../syntax')
let { env } = require('../../../lib/lib/sharedState')

let {
  appendToInputFile,
  readOutputFile,
  removeFile,
  waitForOutputFileChange,
  waitForOutputFileCreation,
  writeInputFile,
} = require('../../io')({ output: 'dist', input: 'src' })

describe('static build', () => {
  it('should be possible to generate tailwind output', async () => {
    await writeInputFile('index.html', html`<div class="font-bold"></div>`)

    await $('webpack --mode=production')

    expect(await readOutputFile('main.css')).toIncludeCss(
      css`
        .font-bold {
          font-weight: 700;
        }
      `
    )
  })

  it('can use a tailwind.config.js configuration file with ESM syntax', async () => {
    await removeFile('tailwind.config.js')
    await writeInputFile('index.html', html`<div class="bg-primary"></div>`)
    await writeInputFile(
      'index.css',
      css`
        @tailwind base;
        @tailwind components;
        @tailwind utilities;
      `
    )
    await writeInputFile(
      '../tailwind.config.js',
      javascript`
        export default {
          content: ['./src/index.html'],
          theme: {
            extend: {
              colors: {
                primary: 'black',
              },
            },
          },
          corePlugins: {
            preflight: false,
          },
        }
      `
    )

    await $('webpack --mode=production')

    if (!env.OXIDE) {
      expect(await readOutputFile('main.css')).toIncludeCss(
        css`
          .bg-primary {
            --tw-bg-opacity: 1;
            background-color: rgb(0 0 0 / var(--tw-bg-opacity));
          }
        `
      )
    }

    if (env.OXIDE) {
      expect(await readOutputFile('main.css')).toIncludeCss(
        css`
          .bg-primary {
            background-color: black;
          }
        `
      )
    }
  })

  it('can use a tailwind.config.ts configuration file', async () => {
    await removeFile('tailwind.config.js')
    await writeInputFile('index.html', html`<div class="bg-primary"></div>`)
    await writeInputFile(
      'index.css',
      css`
        @tailwind base;
        @tailwind components;
        @tailwind utilities;
      `
    )
    await writeInputFile(
      '../tailwind.config.ts',
      javascript`
        import type { Config } from 'tailwindcss'

        export default {
          content: ['./src/index.html'],
          theme: {
            extend: {
              colors: {
                primary: 'black',
              },
            },
          },
          corePlugins: {
            preflight: false,
          },
        } satisfies Config
      `
    )

    await $('webpack --mode=production')

    if (!env.OXIDE) {
      expect(await readOutputFile('main.css')).toIncludeCss(
        css`
          .bg-primary {
            --tw-bg-opacity: 1;
            background-color: rgb(0 0 0 / var(--tw-bg-opacity));
          }
        `
      )
    }

    if (env.OXIDE) {
      expect(await readOutputFile('main.css')).toIncludeCss(
        css`
          .bg-primary {
            background-color: black;
          }
        `
      )
    }
  })
})

describe('watcher', () => {
  test(`classes are generated when the html file changes`, async () => {
    await writeInputFile('index.html', html`<div class="font-bold"></div>`)

    let runningProcess = $('webpack --mode=development --watch')

    await waitForOutputFileCreation('main.css')

    expect(await readOutputFile('main.css')).toIncludeCss(
      css`
        .font-bold {
          font-weight: 700;
        }
      `
    )

    await waitForOutputFileChange('main.css', async () => {
      await appendToInputFile('index.html', html`<div class="font-normal"></div>`)
    })

    expect(await readOutputFile('main.css')).toIncludeCss(
      css`
        .font-bold {
          font-weight: 700;
        }
        .font-normal {
          font-weight: 400;
        }
      `
    )

    await waitForOutputFileChange('main.css', async () => {
      await appendToInputFile('index.html', html`<div class="bg-red-500"></div>`)
    })

    if (!env.OXIDE) {
      expect(await readOutputFile('main.css')).toIncludeCss(
        css`
          .bg-red-500 {
            --tw-bg-opacity: 1;
            background-color: rgb(239 68 68 / var(--tw-bg-opacity));
          }
          .font-bold {
            font-weight: 700;
          }
          .font-normal {
            font-weight: 400;
          }
        `
      )
    }

    if (env.OXIDE) {
      expect(await readOutputFile('main.css')).toIncludeCss(
        css`
          .bg-red-500 {
            background-color: #ef4444;
          }
          .font-bold {
            font-weight: 700;
          }
          .font-normal {
            font-weight: 400;
          }
        `
      )
    }

    return runningProcess.stop()
  })

  test(`classes are generated when globbed files change`, async () => {
    await writeInputFile('glob/index.html', html`<div class="font-bold"></div>`)

    let runningProcess = $('webpack --mode=development --watch')

    await waitForOutputFileCreation('main.css')

    expect(await readOutputFile('main.css')).toIncludeCss(
      css`
        .font-bold {
          font-weight: 700;
        }
      `
    )

    await waitForOutputFileChange('main.css', async () => {
      await appendToInputFile('glob/index.html', html`<div class="font-normal"></div>`)
    })

    expect(await readOutputFile('main.css')).toIncludeCss(
      css`
        .font-bold {
          font-weight: 700;
        }
        .font-normal {
          font-weight: 400;
        }
      `
    )

    await waitForOutputFileChange('main.css', async () => {
      await appendToInputFile('index.html', html`<div class="bg-red-500"></div>`)
    })

    if (!env.OXIDE) {
      expect(await readOutputFile('main.css')).toIncludeCss(
        css`
          .bg-red-500 {
            --tw-bg-opacity: 1;
            background-color: rgb(239 68 68 / var(--tw-bg-opacity));
          }
          .font-bold {
            font-weight: 700;
          }
          .font-normal {
            font-weight: 400;
          }
        `
      )
    }

    if (env.OXIDE) {
      expect(await readOutputFile('main.css')).toIncludeCss(
        css`
          .bg-red-500 {
            background-color: #ef4444;
          }
          .font-bold {
            font-weight: 700;
          }
          .font-normal {
            font-weight: 400;
          }
        `
      )
    }

    return runningProcess.stop()
  })

  test(`classes are generated when the tailwind.config.js file changes`, async () => {
    await writeInputFile('index.html', html`<div class="font-bold md:font-medium"></div>`)

    let runningProcess = $('webpack --mode=development --watch')

    await waitForOutputFileCreation('main.css')

    expect(await readOutputFile('main.css')).toIncludeCss(
      css`
        .font-bold {
          font-weight: 700;
        }
        @media (min-width: 768px) {
          .md\:font-medium {
            font-weight: 500;
          }
        }
      `
    )

    await waitForOutputFileChange('main.css', async () => {
      await writeInputFile(
        '../tailwind.config.js',
        javascript`
          module.exports = {
            content: ['./src/index.html'],
            theme: {
              extend: {
                screens: {
                  md: '800px'
                },
                fontWeight: {
                  bold: 'bold'
                }
              },
            },
            corePlugins: {
              preflight: false,
            },
            plugins: [],
          }
      `
      )
    })

    expect(await readOutputFile('main.css')).toIncludeCss(
      css`
        .font-bold {
          font-weight: bold;
        }
        @media (min-width: 800px) {
          .md\:font-medium {
            font-weight: 500;
          }
        }
      `
    )

    return runningProcess.stop()
  })

  test(`classes are generated when the index.css file changes`, async () => {
    await writeInputFile('index.html', html`<div class="btn font-bold"></div>`)

    let runningProcess = $('webpack --mode=development --watch')

    await waitForOutputFileCreation('main.css')

    expect(await readOutputFile('main.css')).toIncludeCss(
      css`
        .font-bold {
          font-weight: 700;
        }
      `
    )

    await waitForOutputFileChange('main.css', async () => {
      await writeInputFile(
        'index.css',
        css`
          @tailwind base;
          @tailwind components;
          @tailwind utilities;

          @layer components {
            .btn {
              @apply rounded px-2 py-1;
            }
          }
        `
      )
    })

    expect(await readOutputFile('main.css')).toIncludeCss(
      css`
        .btn {
          border-radius: 0.25rem;
          padding: 0.25rem 0.5rem;
        }

        .font-bold {
          font-weight: 700;
        }
      `
    )

    await waitForOutputFileChange('main.css', async () => {
      await writeInputFile(
        'index.css',
        css`
          @tailwind base;
          @tailwind components;
          @tailwind utilities;

          @layer components {
            .btn {
              @apply rounded bg-red-500 px-2 py-1;
            }
          }
        `
      )
    })

    if (!env.OXIDE) {
      expect(await readOutputFile('main.css')).toIncludeCss(
        css`
          .btn {
            border-radius: 0.25rem;
            --tw-bg-opacity: 1;
            background-color: rgb(239 68 68 / var(--tw-bg-opacity));
            padding-left: 0.5rem;
            padding-right: 0.5rem;
            padding-top: 0.25rem;
            padding-bottom: 0.25rem;
          }
          .font-bold {
            font-weight: 700;
          }
        `
      )
    }

    if (env.OXIDE) {
      expect(await readOutputFile('main.css')).toIncludeCss(
        css`
          .btn {
            background-color: #ef4444;
            border-radius: 0.25rem;
            padding: 0.25rem 0.5rem;
          }
          .font-bold {
            font-weight: 700;
          }
        `
      )
    }

    return runningProcess.stop()
  })

  it('should safelist a list of classes to always include', async () => {
    await writeInputFile('index.html', html`<div class="font-bold"></div>`)
    await writeInputFile(
      '../tailwind.config.js',
      javascript`
        module.exports = {
          content: {
            files: ['./src/index.html'],
          },
          safelist: ['bg-red-500','bg-red-600'],
          theme: {
            extend: {
            },
          },
          corePlugins: {
            preflight: false,
          },
          plugins: [],
        }
      `
    )

    let runningProcess = $('webpack --mode=development --watch')

    await waitForOutputFileCreation('main.css')

    if (!env.OXIDE) {
      expect(await readOutputFile('main.css')).toIncludeCss(
        css`
          .bg-red-500 {
            --tw-bg-opacity: 1;
            background-color: rgb(239 68 68 / var(--tw-bg-opacity));
          }

          .bg-red-600 {
            --tw-bg-opacity: 1;
            background-color: rgb(220 38 38 / var(--tw-bg-opacity));
          }

          .font-bold {
            font-weight: 700;
          }
        `
      )
    }

    if (env.OXIDE) {
      expect(await readOutputFile('main.css')).toIncludeCss(
        css`
          .bg-red-500 {
            background-color: #ef4444;
          }

          .bg-red-600 {
            background-color: #dc2626;
          }

          .font-bold {
            font-weight: 700;
          }
        `
      )
    }

    return runningProcess.stop()
  })
})

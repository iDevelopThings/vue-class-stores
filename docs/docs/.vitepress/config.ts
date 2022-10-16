import {SiteData} from "vitepress";
import {DefaultTheme} from "vitepress/theme";


type ThemeConfig = DefaultTheme.Config & {}

const config: Partial<SiteData<ThemeConfig>> = {
    title: 'Vue Class Stores',
    description: 'Powerful class based stores for vue 3',
    themeConfig: {
        siteTitle: 'Vue Class Stores',
        editLink: {
            pattern: 'https://github.com/idevelopthings/vue-class-stores/edit/main/docs/docs/:path'
        },
        nav: [
            {text: 'Github', link: 'https://github.com/idevelopthings/vue-class-stores'}
        ],
        sidebar: [
            {
                text: 'Guide',
                collapsible: true,
                collapsed: true,
                items: [
                    {text: 'Getting Started', link: '/guide/'},
                    {text: 'Creating your first store', link: '/guide/your-first-store'},
                ]
            }
        ]
    }
};

export default config;

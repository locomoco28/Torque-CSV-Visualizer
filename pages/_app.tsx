import {ChakraProvider, DarkMode} from '@chakra-ui/react'

export default function App({Component, pageProps}) {
    return <ChakraProvider ><DarkMode>
        <Component {...pageProps}/>
        </DarkMode>
    </ChakraProvider>
}
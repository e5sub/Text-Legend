package com.textlegend.app

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument

@Composable
fun TextLegendApp(vm: GameViewModel, activity: MainActivity) {
    val navController = rememberNavController()
    val updateInfo by vm.updateInfo.collectAsState()
    val themeMode by vm.themeMode.collectAsState()

    LaunchedEffect(Unit) {
        vm.checkUpdate()
    }

    val darkTheme = when (themeMode) {
        "light" -> false
        "system" -> isSystemInDarkTheme()
        else -> true
    }
    val colorScheme = if (darkTheme) darkColorScheme() else lightColorScheme()
    MaterialTheme(colorScheme = colorScheme) {
        Surface(modifier = Modifier.fillMaxSize()) {
            NavHost(navController = navController, startDestination = "boot") {
                composable("boot") {
                    LaunchedEffect(Unit) {
                        val route = if (vm.hasServerConfig()) {
                            if (vm.hasToken()) "auth" else "auth"
                        } else {
                            "server"
                        }
                        navController.navigate(route) { popUpTo("boot") { inclusive = true } }
                    }
                }
                composable("server") {
                    ServerScreen(
                        initialUrl = vm.getServerUrl(),
                        onSave = { url ->
                            vm.setServerUrl(url)
                            navController.navigate("auth") { popUpTo("server") { inclusive = true } }
                        }
                    )
                }
                composable("auth") {
                    AuthScreen(
                        vm = vm,
                        onServerClick = { navController.navigate("server") },
                        onAuthed = { navController.navigate("characters") { popUpTo("auth") { inclusive = true } } }
                    )
                }
                composable("characters") {
                    CharacterScreen(
                        vm = vm,
                        onEnter = { name ->
                            vm.connectSocket(name)
                            navController.navigate("game/${name}")
                        },
                        onLogout = {
                            vm.logout()
                            navController.navigate("auth") { popUpTo("characters") { inclusive = true } }
                        }
                    )
                }
                composable(
                    route = "game/{name}",
                    arguments = listOf(navArgument("name") { type = NavType.StringType })
                ) {
                    GameScreen(
                        vm = vm,
                        onExit = {
                            vm.disconnectSocket()
                            navController.navigate("characters") { popUpTo("game/{name}") { inclusive = true } }
                        }
                    )
                }
            }

            if (updateInfo != null) {
                AlertDialog(
                    onDismissRequest = { vm.dismissUpdate() },
                    confirmButton = {
                        TextButton(onClick = { vm.startUpdate(activity) }) {
                            Text("更新")
                        }
                    },
                    dismissButton = {
                        TextButton(onClick = { vm.dismissUpdate() }) {
                            Text("稍后")
                        }
                    },
                    title = { Text("发现新版本") },
                    text = { Text("检测到新版本 ${updateInfo?.latestTag}，是否更新？") }
                )
            }
        }
    }
}

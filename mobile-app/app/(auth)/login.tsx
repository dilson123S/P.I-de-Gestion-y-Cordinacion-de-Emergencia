import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '../../src/constants/theme';
import { RolUsuario } from '../../src/types';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Campos requeridos', 'Por favor ingresa correo y contraseña.');
      return;
    }

    setCargando(true);
    try {
      const user = await login(email.trim(), password);
      if (user.rol === RolUsuario.PERSONAL_CAMPO) {
        router.replace('/(campo)/asignaciones');
      } else {
        router.replace('/(ciudadano)/inicio');
      }
    } catch (err: any) {
      const mensaje = err?.response?.data?.mensaje || err.message || 'Credenciales incorrectas';
      Alert.alert('Error de acceso', mensaje);
    } finally {
      setCargando(false);
    }
  };

  /** Accesos directos para pruebas de desarrollo */
  const llenarDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Marca Institucional */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={44} color="#ffffff" />
          </View>
          <Text style={styles.title}>SIGEM Móvil</Text>
          <Text style={styles.subtitle}>Gestión y Coordinación Unificada de Emergencias</Text>
          <View style={styles.headerTag}>
            <Text style={styles.headerTagText}>RNF-07 • CANAL DE AUXILIO DIGITAL</Text>
          </View>
        </View>

        {/* Formulario */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Iniciar Sesión</Text>

          <Text style={styles.label}>Correo Electrónico</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="correo@ejemplo.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!mostrarPassword}
            />
            <TouchableOpacity
              onPress={() => setMostrarPassword(!mostrarPassword)}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={mostrarPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, cargando && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={cargando}
            activeOpacity={0.85}
          >
            {cargando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Ingresar al Sistema</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkButton}
            onPress={() => router.push('/(auth)/registro')}
          >
            <Text style={styles.linkText}>
              ¿Eres ciudadano y no tienes cuenta? <Text style={styles.linkBold}>Regístrate aquí</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Accesos Rápidos para Evaluación y Pruebas */}
        <View style={styles.demoCard}>
          <Text style={styles.demoTitle}>Cuentas Semilla para Pruebas:</Text>
          <View style={styles.demoButtonsRow}>
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => llenarDemo('ciudadano@correo.com', 'ciudadano123')}
            >
              <Ionicons name="person-circle" size={14} color={Colors.primary} />
              <Text style={styles.demoBtnText}>Ciudadano</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => llenarDemo('campo1@emergencias.gob', 'campo123')}
            >
              <Ionicons name="car-sport" size={14} color={Colors.primary} />
              <Text style={styles.demoBtnText}>Personal Campo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.demoBtn}
              onPress={() => llenarDemo('operador1@emergencias.gob', 'operador123')}
            >
              <Ionicons name="headset" size={14} color={Colors.primary} />
              <Text style={styles.demoBtnText}>Operador</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    ...Shadows.md,
    shadowColor: Colors.primary,
    shadowOpacity: 0.25,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '900',
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.xs + 1,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
    maxWidth: 280,
  },
  headerTag: {
    marginTop: Spacing.sm,
    backgroundColor: '#eff6ff',
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  headerTagText: {
    fontSize: FontSize.xs - 2,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.8,
  },
  formCard: {
    backgroundColor: '#ffffff',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.sm,
  },
  formTitle: {
    fontSize: FontSize.md + 1,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.xs + 1,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
    marginTop: Spacing.xs + 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: BorderRadius.md,
    backgroundColor: '#f8fafc',
    paddingHorizontal: Spacing.sm + 2,
    height: 48,
    marginBottom: Spacing.sm,
  },
  inputIcon: {
    marginRight: Spacing.xs + 2,
  },
  input: {
    flex: 1,
    fontSize: FontSize.sm + 1,
    color: Colors.text,
  },
  eyeBtn: {
    padding: Spacing.xs,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadows.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: FontSize.sm + 1,
    fontWeight: '800',
  },
  linkButton: {
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  linkText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs + 1,
    textAlign: 'center',
  },
  linkBold: {
    color: Colors.primary,
    fontWeight: '700',
  },
  demoCard: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  demoTitle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs + 2,
    fontWeight: '600',
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  demoBtnText: {
    fontSize: FontSize.xs - 1,
    color: Colors.text,
    fontWeight: '600',
  },
});

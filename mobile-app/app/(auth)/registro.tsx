import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '../../src/constants/theme';
import { RolUsuario } from '../../src/types';

export default function RegistroScreen() {
  const router = useRouter();
  const { registrar } = useAuth();
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [rol, setRol] = useState<RolUsuario>(RolUsuario.CIUDADANO);

  const handleRegistro = async () => {
    if (!nombre.trim() || !apellido.trim() || !email.trim() || !password) {
      Alert.alert('Campos requeridos', 'Por favor llena todos los campos obligatorios (*).');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Contraseña débil', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setCargando(true);
    try {
      await registrar({
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.trim(),
        telefono: telefono.trim() || undefined,
        password,
        rol,
      });

      Alert.alert(
        'Registro exitoso',
        rol === RolUsuario.CIUDADANO
          ? 'Tu perfil de ciudadano quedó creado. Ya puedes iniciar sesión para reportar emergencias.'
          : 'Tu perfil de operador quedó creado. Usa estas credenciales para acceder al panel web de operaciones.',
        [{ text: 'Comenzar', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (err: any) {
      const errorDeRed = !err?.response && err?.message === 'Network Error';
      const mensaje =
        err?.response?.data?.mensaje ||
        err?.response?.data?.errores ||
        (errorDeRed
          ? 'No se pudo conectar con el servidor. Verifica que el backend esté iniciado y que el teléfono y la computadora estén en la misma red Wi-Fi.'
          : err.message) ||
        'No se pudo completar el registro.';
      Alert.alert('Error en el registro', typeof mensaje === 'string' ? mensaje : JSON.stringify(mensaje));
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Botón Volver */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.text} />
          <Text style={styles.backText}>Volver al Login</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Crear perfil</Text>
        <Text style={styles.subtitle}>
          Elige el tipo de cuenta que necesitas.
        </Text>

        <View style={styles.formCard}>
          <Text style={styles.label}>Tipo de perfil *</Text>
          <View style={styles.roleOptions}>
            <TouchableOpacity
              accessibilityRole="radio"
              accessibilityState={{ selected: rol === RolUsuario.CIUDADANO }}
              style={[styles.roleOption, rol === RolUsuario.CIUDADANO && styles.roleOptionSelected]}
              onPress={() => setRol(RolUsuario.CIUDADANO)}
              activeOpacity={0.8}
            >
              <Ionicons name="person-circle-outline" size={24} color={rol === RolUsuario.CIUDADANO ? Colors.primary : Colors.textSecondary} />
              <View style={styles.roleOptionCopy}>
                <Text style={styles.roleOptionTitle}>Ciudadano</Text>
                <Text style={styles.roleOptionDescription}>Reporta emergencias</Text>
              </View>
              {rol === RolUsuario.CIUDADANO && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="radio"
              accessibilityState={{ selected: rol === RolUsuario.OPERADOR }}
              style={[styles.roleOption, rol === RolUsuario.OPERADOR && styles.roleOptionSelected]}
              onPress={() => setRol(RolUsuario.OPERADOR)}
              activeOpacity={0.8}
            >
              <Ionicons name="headset-outline" size={24} color={rol === RolUsuario.OPERADOR ? Colors.primary : Colors.textSecondary} />
              <View style={styles.roleOptionCopy}>
                <Text style={styles.roleOptionTitle}>Operador</Text>
                <Text style={styles.roleOptionDescription}>Gestiona reportes</Text>
              </View>
              {rol === RolUsuario.OPERADOR && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Nombre *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Ej. Juan"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <Text style={styles.label}>Apellido *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={apellido}
              onChangeText={setApellido}
              placeholder="Ej. Pérez"
              placeholderTextColor="#94a3b8"
            />
          </View>

          <Text style={styles.label}>Correo Electrónico *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
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

          <Text style={styles.label}>Teléfono de Contacto (Para llamadas de rescate)</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="call-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={telefono}
              onChangeText={setTelefono}
              placeholder="+505 8888-0000"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
            />
          </View>

          <Text style={styles.label}>Contraseña *</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.textSecondary} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Al menos 6 caracteres"
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

          <View style={styles.disclaimerBox}>
            <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
            <Text style={styles.disclaimerText}>
              Tus datos personales y de ubicación están protegidos y solo se emplean para responder a tus llamadas de auxilio.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, cargando && styles.buttonDisabled]}
            onPress={handleRegistro}
            disabled={cargando}
            activeOpacity={0.85}
          >
            {cargando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Crear Mi Cuenta</Text>
            )}
          </TouchableOpacity>
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
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: '600',
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '900',
    color: Colors.text,
  },
  subtitle: {
    fontSize: FontSize.xs + 1,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    marginTop: 4,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: '#ffffff',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Shadows.sm,
  },
  label: {
    fontSize: FontSize.xs + 1,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
    marginTop: Spacing.xs + 2,
  },
  roleOptions: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 62,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: BorderRadius.md,
    backgroundColor: '#ffffff',
  },
  roleOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#eff6ff',
  },
  roleOptionCopy: {
    flex: 1,
  },
  roleOptionTitle: {
    color: Colors.text,
    fontSize: FontSize.sm + 1,
    fontWeight: '700',
  },
  roleOptionDescription: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    marginTop: 2,
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
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    padding: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing.sm,
  },
  disclaimerText: {
    fontSize: FontSize.xs - 1,
    color: Colors.primary,
    flex: 1,
    lineHeight: 16,
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
});
